import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { PaymentIntentModel } from '../../../model/payment-intent.model'
import { Numeric, Id, AbstractInteractor, UUID } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'
import { OperationTypeMapper } from '../../../../../shared/projection/operation-type.mapper'
import { TransactionModel } from '../../../../../shared/model/transaction.model'

export interface UnderpayPaymentOperationParams {
  readonly payment: PaymentIntentModel
  readonly tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executedAt'>
  readonly transferIds: ReadonlySet<Id>
  readonly amount: Numeric
  readonly expectedAmount: Numeric
  readonly payoutId?: UUID | Id
}

export class UnderpayPaymentOperation extends AbstractInteractor<
  UnderpayPaymentOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: UnderpayPaymentOperationParams): ReadonlyArray<BalanceChange> {
    const { payment, amount, expectedAmount, transferIds, tx, payoutId } = params

    const isInternalTransfer =
      payment.to.account === payment.member.accountId && payment.integration === IntegrationType.INTERNAL
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
          reason: BalanceChangeReason.UNDERPAY,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
          expectedAmount,
        },
      },
    ]
  }
}
