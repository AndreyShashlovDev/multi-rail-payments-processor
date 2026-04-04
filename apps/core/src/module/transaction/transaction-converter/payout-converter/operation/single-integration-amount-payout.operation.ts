import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'
import { PayoutIntentModel } from '../../../../payout-intent/model/payout-intent.model'
import { OperationTypeMapper } from '../../../../../shared/converter/operation-type.mapper'

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

    const basicData: Pick<BalanceChange, 'intentType' | 'intentId' | 'operationType'> = {
      intentType: IntentType.PAYOUT,
      intentId: payout.id,
      operationType: OperationTypeMapper.toBalanceChange(payout.operationType),
    }

    return [
      {
        type: BalanceChangeType.RELEASE_HOLD,
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.fromAmount,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          reason: BalanceChangeReason.AMOUNT,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
      {
        type: BalanceChangeType.DEBIT,
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.fromAmount,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          reason: BalanceChangeReason.AMOUNT,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
    ]
  }
}
