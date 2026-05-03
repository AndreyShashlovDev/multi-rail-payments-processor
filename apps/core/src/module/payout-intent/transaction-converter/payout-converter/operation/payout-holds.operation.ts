import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PayoutBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType } from '@app/shared'
import { PayoutIntentModel } from '../../../model/payout-intent.model'
import { OperationTypeMapper } from '../../../../../shared/projection/operation-type.mapper'
import { TransactionModel } from '../../../../../shared/model/transaction.model'

export interface PayoutHoldsOperationParams {
  readonly payout: PayoutIntentModel
  readonly tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executedAt'>
  readonly transferIds: ReadonlySet<Id>
}

export class PayoutHoldsOperation extends AbstractInteractor<
  PayoutHoldsOperationParams,
  ReadonlyArray<BalanceChange<PayoutBalanceChangeMetadata>>
> {
  execute(params: PayoutHoldsOperationParams): ReadonlyArray<BalanceChange<PayoutBalanceChangeMetadata>> {
    const { payout, transferIds, tx } = params

    const optionalHolds: BalanceChange<PayoutBalanceChangeMetadata>[] = []
    const isInternalTransfer = payout.member.accountId === payout.from.account

    const amountIntegrationAccount = isInternalTransfer ? null : payout.from.account
    const platformFeeIntegrationAccount = isInternalTransfer ? null : payout.from.account
    const integrationFeeIntegrationAccount = isInternalTransfer ? null : payout.platformFeeAccount?.account

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
      transferIds: Array.from(transferIds),
      txStatus: BalanceChangeTxStatus.TX_PREPARED,
    }

    if (payout.platformFee && payout.platformFee.gt(0)) {
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

    if (payout.integrationFee && payout.integrationFee.gt(0)) {
      const convertedIntegrationFee = payout.integrationFee.mul(payout.integrationFeeRate)
      const diff = payout.estimatedFee.minus(convertedIntegrationFee).div(payout.integrationFeeRate)

      optionalHolds.push({
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount: integrationFeeIntegrationAccount ?? null,
        currency: payout.estimatedFeeCurrency,
        integration: payout.fromIntegration,
        amount: payout.estimatedFee,
        metadata: {
          ...basicMetadata,
          reason: BalanceChangeReason.INTEGRATION_FEE,
          integrationFeeDiff: diff,
        },
      })

      if (payout.integrationFeePayer) {
        optionalHolds.push({
          ...basicData,
          platformAccountId: payout.integrationFeePayer.platformAccountId ?? null,
          integrationAccount: isInternalTransfer ? null : payout.integrationFeePayer.account,
          currency: payout.integrationFeeCurrency,
          integration: payout.fromIntegration,
          amount: payout.integrationFee,
          metadata: {
            ...basicMetadata,
            reason: BalanceChangeReason.INTEGRATION_FEE,
            integrationFeeDiff: diff,
          },
        })
      }
    }

    return [
      {
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount: amountIntegrationAccount,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.fromAmount,
        metadata: {
          ...basicMetadata,
          reason: BalanceChangeReason.AMOUNT,
        },
      },
      ...optionalHolds,
    ]
  }
}
