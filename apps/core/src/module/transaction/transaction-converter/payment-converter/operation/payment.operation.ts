import { BalanceChange, BalanceChangeTxStatus, BalanceChangeReason } from '@app/shared/types/balance-change'
import { PaymentIntentModel } from '../../../../payment-intent/model/payment-intent.model'
import { Numeric, Id, AbstractInteractor, UUID } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'

export interface PaymentOperationParams {
  readonly payment: PaymentIntentModel
  readonly amount: Numeric
  readonly txId: Id
  readonly transferIds: ReadonlySet<Id>
  readonly payoutId?: UUID | Id
}

export class PaymentOperation extends AbstractInteractor<PaymentOperationParams, ReadonlyArray<BalanceChange>> {
  execute(params: PaymentOperationParams): ReadonlyArray<BalanceChange> {
    const { payment, amount, transferIds, txId, payoutId } = params

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
        amount,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          intentType: IntentType.PAYMENT,
          intentId: payment.id,
          relatedIntentType: payoutId ? IntentType.PAYOUT : undefined,
          relatedIntentId: payoutId,
          reason: BalanceChangeReason.AMOUNT,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
    ]
  }
}
