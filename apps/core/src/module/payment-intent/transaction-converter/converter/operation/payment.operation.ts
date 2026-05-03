import {
  BalanceChange,
  BalanceChangeTxStatus,
  BalanceChangeReason,
  PaymentBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { PaymentIntentModel } from '../../../model/payment-intent.model'
import { Numeric, Id, AbstractInteractor, UUID } from '@app/types'
import { IntentType, BalanceChangeType } from '@app/shared'
import { OperationTypeMapper } from '../../../../../shared/projection/operation-type.mapper'
import { TransactionModel } from '../../../../../shared/model/transaction.model'

export interface PaymentOperationParams {
  readonly payment: PaymentIntentModel
  readonly amount: Numeric
  readonly tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executedAt'>
  readonly transferIds: ReadonlySet<Id>
  readonly payoutId?: UUID | Id
}

export class PaymentOperation extends AbstractInteractor<
  PaymentOperationParams,
  ReadonlyArray<BalanceChange<PaymentBalanceChangeMetadata>>
> {
  execute(params: PaymentOperationParams): ReadonlyArray<BalanceChange<PaymentBalanceChangeMetadata>> {
    const { payment, amount, transferIds, tx, payoutId } = params

    const isInternalTransfer = payment.to.account === payment.member.accountId
    const integrationAccount = isInternalTransfer ? null : payment.to.account

    return [
      {
        type: BalanceChangeType.CREDIT,
        intentType: IntentType.PAYMENT,
        intentId: payment.id,
        operationType: OperationTypeMapper.toBalanceChange(payment.operationType),
        platformAccountId: payment.to.platformAccountId,
        integrationAccount,
        currency: payment.currency,
        integration: payment.integration,
        amount,
        metadata: {
          txId: tx.id,
          sourceTxId: tx.sourceTxId,
          executedAt: tx.executedAt,
          transferIds: Array.from(transferIds),
          relatedIntentType: payoutId ? IntentType.PAYOUT : undefined,
          relatedIntentId: payoutId,
          reason: BalanceChangeReason.AMOUNT,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
    ]
  }
}
