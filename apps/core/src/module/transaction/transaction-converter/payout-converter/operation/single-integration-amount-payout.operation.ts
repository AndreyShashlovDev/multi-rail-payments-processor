import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'
import { PayoutIntentModel } from '../../../../payout-intent/model/payout-intent.model'

export interface PayoutOperationParams {
  readonly payout: PayoutIntentModel
  readonly txId: Id
  readonly transferIds: ReadonlySet<Id>
}

export class SingleIntegrationAmountPayoutOperation extends AbstractInteractor<
  PayoutOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: PayoutOperationParams): ReadonlyArray<BalanceChange> {
    const { payout, transferIds, txId } = params

    const integrationAccount =
      payout.member.accountId === payout.from.account && payout.fromIntegration === IntegrationType.INTERNAL
        ? null
        : payout.from.account

    return [
      {
        type: BalanceChangeType.RELEASE_HOLD,
        platformAccountId: payout.member.accountId,
        integrationAccount,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.fromAmount,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          intentType: IntentType.PAYOUT,
          reason: BalanceChangeReason.AMOUNT,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
          intentId: payout.id,
        },
      },
      {
        type: BalanceChangeType.DEBIT,
        platformAccountId: payout.member.accountId,
        integrationAccount,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.fromAmount,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          intentType: IntentType.PAYOUT,
          reason: BalanceChangeReason.AMOUNT,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
          intentId: payout.id,
        },
      },
    ]
  }
}
