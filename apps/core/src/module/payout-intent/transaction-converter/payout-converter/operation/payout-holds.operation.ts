import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PayoutBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { AbstractInteractor, UUID, IntegrationAccount } from '@app/types'
import { IntentType, BalanceChangeType, ExecutionType } from '@app/shared'
import { PayoutIntentModel } from '../../../model/payout-intent.model'
import { OperationTypeMapper } from '../../../../../shared/projection/operation-type.mapper'
import { TransactionModel } from '../../../../../shared/model/transaction.model'
import { TransferModel } from '../../../../../shared/model/transfer.model'
import { IntegrationAccountLinkModel } from '../../../../../shared/model/integration-account-link.model'

export interface PayoutHoldsOperationParams {
  readonly payout: PayoutIntentModel
  readonly tx: Omit<TransactionModel, 'transfers'>
  readonly transfer: TransferModel
  readonly txInitiator: IntegrationAccountLinkModel | null
  readonly from: { platformAccountId: UUID | null; integrationAccount: IntegrationAccount | null }
}

export class PayoutHoldsOperation extends AbstractInteractor<
  PayoutHoldsOperationParams,
  ReadonlyArray<BalanceChange<PayoutBalanceChangeMetadata>>
> {
  execute(params: PayoutHoldsOperationParams): ReadonlyArray<BalanceChange<PayoutBalanceChangeMetadata>> {
    const { payout, tx, transfer, txInitiator, from } = params

    const optionalHolds: BalanceChange<PayoutBalanceChangeMetadata>[] = []
    const isInternalTransfer = tx.executionType === ExecutionType.INTERNAL

    const amountIntegrationAccount = isInternalTransfer ? null : from.integrationAccount
    const platformFeeIntegrationAccount = isInternalTransfer ? null : from.integrationAccount

    if (!from.platformAccountId && !from.integrationAccount) {
      return []
    }

    const basicData: Pick<
      BalanceChange<PayoutBalanceChangeMetadata>,
      'intentType' | 'intentId' | 'operationType' | 'type'
    > = {
      type: BalanceChangeType.HOLD,
      intentType: IntentType.PAYOUT,
      intentId: payout.id,
      operationType: OperationTypeMapper.toBalanceChange(payout.operationType),
    }

    const basicMetadata: Omit<PayoutBalanceChangeMetadata, 'reason'> = {
      txId: tx.id,
      sourceTxId: tx.sourceTxId,
      executedAt: tx.executedAt,
      transferIds: [transfer.id],
      txStatus: BalanceChangeTxStatus.TX_PREPARED,
      executionType: tx.executionType,
    }

    if (payout.platformFee && payout.platformFee.gt(0) && from.platformAccountId === payout.member.accountId) {
      optionalHolds.push({
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount: platformFeeIntegrationAccount,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.platformFee,
        metadata: {
          ...basicMetadata,
          reason: BalanceChangeReason.FEE,
        },
      })
    }

    if (tx.fee && tx.fee.gt(0) && txInitiator) {
      const convertedIntegrationFee = tx.fee.mul(payout.integrationFeeRate)
      const diff = payout.estimatedFee.minus(convertedIntegrationFee).div(payout.integrationFeeRate)

      optionalHolds.push({
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount:
          txInitiator.platformAccountId === payout.member.accountId ? txInitiator.integrationAccount.account : null,
        currency: payout.estimatedFeeCurrency,
        integration: payout.fromIntegration,
        amount: payout.estimatedFee,
        metadata: {
          ...basicMetadata,
          reason: BalanceChangeReason.INTEGRATION_FEE,
          integrationFeeDiff: diff,
        },
      })

      if (txInitiator.platformAccountId !== payout.member.accountId) {
        optionalHolds.push({
          ...basicData,
          platformAccountId: txInitiator.platformAccountId,
          integrationAccount: txInitiator.integrationAccount.account,
          currency: tx.feeCurrency,
          integration: tx.integration,
          amount: tx.fee,
          metadata: {
            ...basicMetadata,
            reason: BalanceChangeReason.INTEGRATION_FEE,
          },
        })
      }
    }

    return [
      {
        ...basicData,
        platformAccountId: from.platformAccountId,
        integrationAccount: amountIntegrationAccount,
        currency: transfer.currency,
        integration: tx.integration,
        amount: transfer.amount,
        metadata: {
          ...basicMetadata,
          reason: BalanceChangeReason.AMOUNT,
        },
      },
      ...optionalHolds,
    ]
  }
}
