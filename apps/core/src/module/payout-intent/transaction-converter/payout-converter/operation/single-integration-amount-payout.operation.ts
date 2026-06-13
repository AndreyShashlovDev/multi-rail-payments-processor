import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PayoutBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { Id, AbstractInteractor, UUID, IntegrationAccount } from '@app/types'
import { IntentType, BalanceChangeType, ExecutionType } from '@app/shared'
import { PayoutIntentModel } from '../../../model/payout-intent.model'
import { OperationTypeMapper } from '../../../../../shared/projection/operation-type.mapper'
import { TransactionModel } from '../../../../../shared/model/transaction.model'
import { TransferModel } from '../../../../../shared/model/transfer.model'

export interface PayoutOperationParams {
  readonly payout: PayoutIntentModel
  readonly tx: Omit<TransactionModel, 'transfers'>
  readonly transfer: TransferModel
  readonly transferIds: ReadonlySet<Id>
  readonly from: { platformAccountId: UUID | null; integrationAccount: IntegrationAccount | null }
}

export class SingleIntegrationAmountPayoutOperation extends AbstractInteractor<
  PayoutOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: PayoutOperationParams): ReadonlyArray<BalanceChange> {
    const { payout, tx, transfer, transferIds, from } = params

    const isInternalTransfer = tx.executionType === ExecutionType.INTERNAL
    // вероятно это уже не нужно будет!
    const integrationAccount = isInternalTransfer ? null : from.integrationAccount

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
      executionType: tx.executionType,
    }

    const amountChange = {
      ...basicData,
      platformAccountId: from.platformAccountId,
      integrationAccount,
      currency: transfer.currency,
      integration: tx.integration,
      amount: transfer.amount,
      metadata: {
        ...basicMetadata,
        reason: BalanceChangeReason.AMOUNT,
      },
    }

    return [
      { type: BalanceChangeType.RELEASE_HOLD, ...amountChange },
      { type: BalanceChangeType.DEBIT, ...amountChange },
    ]
  }
}
