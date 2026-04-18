import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PaymentBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { PaymentIntentModel } from '../../../model/payment-intent.model'
import { Numeric, Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'
import { OperationTypeMapper } from '../../../../../shared/projection/operation-type.mapper'
import { TransactionModel } from '../../../../../shared/model/transaction.model'

export interface OverpayPaymentOperationParams {
  readonly payment: PaymentIntentModel
  readonly tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executedAt'>
  readonly transferIds: ReadonlySet<Id>
  readonly transferAmount: Numeric
  readonly expectedAmount: Numeric
  readonly overpay: Numeric
}

export class OverpayPaymentOperation extends AbstractInteractor<
  OverpayPaymentOperationParams,
  ReadonlyArray<BalanceChange<PaymentBalanceChangeMetadata>>
> {
  execute(params: OverpayPaymentOperationParams): ReadonlyArray<BalanceChange<PaymentBalanceChangeMetadata>> {
    const { payment, overpay, transferAmount, transferIds, tx, expectedAmount } = params

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
        amount: transferAmount,
        metadata: {
          txId: tx.id,
          sourceTxId: tx.sourceTxId,
          executedAt: tx.executedAt,
          transferIds: Array.from(transferIds),
          reason: BalanceChangeReason.OVERPAY,
          overpay,
          expectedAmount,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
      {
        type: BalanceChangeType.HOLD,
        intentType: IntentType.PAYMENT,
        intentId: payment.id,
        operationType: OperationTypeMapper.toBalanceChange(payment.operationType),
        platformAccountId: payment.to.platformAccountId,
        integrationAccount,
        currency: payment.currency,
        integration: payment.integration,
        amount: transferAmount,
        metadata: {
          txId: tx.id,
          sourceTxId: tx.sourceTxId,
          executedAt: tx.executedAt,
          transferIds: Array.from(transferIds),
          reason: BalanceChangeReason.OVERPAY,
          overpay,
          expectedAmount,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
    ]
  }
}
