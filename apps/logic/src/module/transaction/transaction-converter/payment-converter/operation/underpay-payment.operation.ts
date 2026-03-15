import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { PaymentIntentModel } from '../../../../payment-intent/model/payment-intent.model'
import { Numeric, Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'

export interface UnderpayPaymentOperationParams {
  readonly payment: PaymentIntentModel
  readonly txId: Id
  readonly transferIds: ReadonlySet<Id>
  readonly amount: Numeric
  readonly expectedAmount: Numeric
}

export class UnderpayPaymentOperation extends AbstractInteractor<
  UnderpayPaymentOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: UnderpayPaymentOperationParams): ReadonlyArray<BalanceChange> {
    const { payment, amount, expectedAmount, transferIds, txId } = params

    const isInternalTransfer =
      payment.to.account === payment.member.accountId && payment.integration === IntegrationType.INTERNAL

    const integrationAccount = isInternalTransfer ? null : payment.to.account

    return [
      {
        type: BalanceChangeType.CREDIT,
        platformAccountId: payment.to.platformAccountId,
        integrationAccount,
        currency: payment.currency,
        integration: payment.integration,
        amount: amount,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          intentType: IntentType.PAYMENT,
          intentId: payment.id,
          reason: BalanceChangeReason.UNDERPAY,
          actualAmount: amount,
          expectedAmount,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
      {
        type: BalanceChangeType.HOLD,
        platformAccountId: payment.to.platformAccountId,
        integrationAccount,
        currency: payment.currency,
        integration: payment.integration,
        amount: amount,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          intentType: IntentType.PAYMENT,
          intentId: payment.id,
          reason: BalanceChangeReason.UNDERPAY,
          actualAmount: amount,
          expectedAmount,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
    ]
  }
}
