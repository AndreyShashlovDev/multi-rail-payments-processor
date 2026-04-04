import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { PaymentIntentModel } from '../../../../payment-intent/model/payment-intent.model'
import { Numeric, Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'

export interface OverpayPaymentOperationParams {
  readonly payment: PaymentIntentModel
  readonly txId: Id
  readonly transferIds: ReadonlySet<Id>
  readonly transferAmount: Numeric
  readonly overpay: Numeric
}

export class OverpayPaymentOperation extends AbstractInteractor<
  OverpayPaymentOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: OverpayPaymentOperationParams): ReadonlyArray<BalanceChange> {
    const { payment, overpay, transferAmount, transferIds, txId } = params

    const isInternalTransfer =
      payment.to.account === payment.member.accountId && payment.integration === IntegrationType.INTERNAL

    const integrationAccount = isInternalTransfer ? null : payment.to.account

    return [
      {
        type: BalanceChangeType.HOLD,
        platformAccountId: payment.to.platformAccountId,
        integrationAccount,
        currency: payment.currency,
        integration: payment.integration,
        amount: overpay,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          intentType: IntentType.PAYMENT,
          intentId: payment.id,
          reason: BalanceChangeReason.OVERPAY,
          overpay,
          expectedAmount: payment.amount,
          actualAmount: transferAmount,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
    ]
  }
}
