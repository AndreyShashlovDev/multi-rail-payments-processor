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
import { TransferModel } from '../../../../../shared/model/transfer.model'
import { IntegrationAccountLinkModel } from '../../../../../shared/model/integration-account-link.model'

export interface IntegrationFeePayoutOperationParams {
  readonly payout: PayoutIntentModel
  readonly tx: Omit<TransactionModel, 'transfers'>
  readonly transfer: TransferModel
  readonly transferIds: ReadonlySet<Id>
  readonly txInitiator: IntegrationAccountLinkModel | null
}

export class IntegrationFeePayoutOperation extends AbstractInteractor<
  IntegrationFeePayoutOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: IntegrationFeePayoutOperationParams): ReadonlyArray<BalanceChange> {
    const { payout, tx, transferIds, txInitiator } = params

    if (!tx.fee || tx.fee.lte(0) || !txInitiator) {
      return []
    }

    const convertedIntegrationFee = tx.fee.mul(payout.integrationFeeRate)
    const diff = payout.estimatedFee.minus(convertedIntegrationFee).div(payout.integrationFeeRate)
    // const userIntegrationFee = Numeric.min(convertedIntegrationFee, payout.estimatedFee)

    const metadata: PayoutBalanceChangeMetadata = {
      txId: tx.id,
      sourceTxId: tx.sourceTxId,
      executedAt: tx.executedAt,
      transferIds: Array.from(transferIds),
      reason: BalanceChangeReason.INTEGRATION_FEE,
      txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
      integrationFeeDiff: diff,
      executionType: tx.executionType,
    }

    const basicData: Pick<BalanceChange, 'intentType' | 'intentId' | 'operationType'> = {
      intentType: IntentType.PAYOUT,
      intentId: payout.id,
      operationType: OperationTypeMapper.toBalanceChange(payout.operationType),
    }

    const result: BalanceChange[] = [
      {
        type: BalanceChangeType.RELEASE_HOLD,
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount:
          txInitiator.platformAccountId === payout.member.accountId ? txInitiator.integrationAccount.account : null,
        currency: payout.estimatedFeeCurrency,
        integration: payout.fromIntegration,
        amount: payout.estimatedFee,
        metadata,
      },
      {
        type: BalanceChangeType.DEBIT,
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount:
          txInitiator.platformAccountId === payout.member.accountId ? txInitiator.integrationAccount.account : null,
        currency: payout.integrationFeeCurrency,
        integration: payout.fromIntegration,
        amount: payout.integrationFee!,
        metadata,
      },
      {
        type: BalanceChangeType.CREDIT,
        ...basicData,
        platformAccountId: txInitiator.platformAccountId,
        integrationAccount: null,
        currency: payout.integrationFeeCurrency,
        integration: payout.fromIntegration,
        amount: payout.integrationFee!,
        metadata,
      },
    ]

    if (txInitiator.platformAccountId !== payout.member.accountId) {
      result.push(
        ...[
          {
            type: BalanceChangeType.RELEASE_HOLD,
            ...basicData,
            platformAccountId: txInitiator.platformAccountId,
            integrationAccount: txInitiator.integrationAccount.account,
            currency: tx.feeCurrency,
            integration: tx.integration,
            amount: tx.fee,
            metadata,
          },
          {
            type: BalanceChangeType.DEBIT,
            ...basicData,
            platformAccountId: txInitiator.platformAccountId,
            integrationAccount: txInitiator.integrationAccount.account,
            currency: tx.feeCurrency,
            integration: tx.integration,
            amount: tx.fee,
            metadata,
          },
        ],
      )
    }

    return result
  }
}
