import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PayoutBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'
import { PayoutIntentModel } from '../../../../payout-intent/model/payout-intent.model'
import { OperationTypeMapper } from '../../../../../shared/converter/operation-type.mapper'
import { TransactionModel } from '../../../model/transaction.model'

export interface PayoutOperationParams {
  readonly payout: PayoutIntentModel
  readonly tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executedAt'>
  readonly transferIds: ReadonlySet<Id>
}

export class SingleIntegrationAmountPayoutOperation extends AbstractInteractor<
  PayoutOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: PayoutOperationParams): ReadonlyArray<BalanceChange> {
    const { payout, transferIds, tx } = params

    const integrationAccount =
      payout.member.accountId === payout.from.account && payout.fromIntegration === IntegrationType.INTERNAL
        ? null
        : payout.from.account

    const basicData: Pick<BalanceChange, 'intentType' | 'intentId' | 'operationType'> = {
      intentType: IntentType.PAYOUT,
      intentId: payout.id,
      operationType: OperationTypeMapper.toBalanceChange(payout.operationType),
    }

    const basicMetadata: Omit<PayoutBalanceChangeMetadata, 'reason'> = {
      txId: tx.id,
      sourceTxId: tx.sourceTxId,
      executedAt: tx.executedAt,
      transferIds: Array.from(transferIds),
      txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
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
          ...basicMetadata,
          reason: BalanceChangeReason.AMOUNT,
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
          ...basicMetadata,
          reason: BalanceChangeReason.AMOUNT,
        },
      },
    ]
  }
}
