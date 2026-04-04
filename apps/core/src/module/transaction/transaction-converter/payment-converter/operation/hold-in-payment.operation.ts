import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  BalanceChangeOperationType,
} from '@app/shared/types/balance-change'
import { Id, AbstractInteractor, UUID, IntegrationAccount, Numeric, IntegrationCurrency } from '@app/types'
import { IntentType, IntegrationType, BalanceChangeType } from '@app/shared'
import { PaymentIntentModel } from '../../../../payment-intent/model/payment-intent.model'
import { OperationTypeMapper } from '../../../../../shared/converter/operation-type.mapper'

export interface HoldInOperationParams {
  readonly integration: IntegrationType
  readonly platformAccountId: UUID | null
  readonly integrationAccount: IntegrationAccount | null
  readonly amount: Numeric
  readonly currency: IntegrationCurrency

  readonly txId: Id
  readonly transferIds: ReadonlySet<Id>
  readonly operationType: BalanceChangeOperationType | null
  readonly paymentId?: UUID | null
  readonly payoutId?: UUID | Id

  readonly action: 'hold' | 'release'
  readonly reason: BalanceChangeReason
  readonly txStatus: BalanceChangeTxStatus.TX_ACCEPTED | BalanceChangeTxStatus.TX_CONFIRMED
}

export class HoldInPaymentOperation extends AbstractInteractor<HoldInOperationParams, ReadonlyArray<BalanceChange>> {
  static createParamsByPayment(data: {
    readonly payment: PaymentIntentModel
    readonly amount: Numeric
    readonly txId: Id
    readonly transferIds: ReadonlySet<Id>
    readonly payoutId?: UUID | Id
    readonly action: 'hold' | 'release'
    readonly reason: BalanceChangeReason
    readonly txStatus: BalanceChangeTxStatus.TX_ACCEPTED | BalanceChangeTxStatus.TX_CONFIRMED
  }): HoldInOperationParams {
    const isInternalTransfer =
      data.payment.to.account === data.payment.member.accountId && data.payment.integration === IntegrationType.INTERNAL

    const integrationAccount = isInternalTransfer ? null : data.payment.to.account

    return {
      integration: data.payment.integration,
      platformAccountId: data.payment.to.platformAccountId,
      integrationAccount,
      amount: data.amount,
      currency: data.payment.currency,
      paymentId: data.payment.id,
      txId: data.txId,
      transferIds: data.transferIds,
      operationType: OperationTypeMapper.toBalanceChange(data.payment.operationType),
      payoutId: data.payoutId,
      action: data.action,
      reason: data.reason,
      txStatus: data.txStatus,
    }
  }

  execute(params: HoldInOperationParams): ReadonlyArray<BalanceChange> {
    const {
      integration,
      platformAccountId,
      integrationAccount,
      amount,
      currency,
      transferIds,
      txId,
      operationType,
      paymentId,
      payoutId,
      action,
      reason,
      txStatus,
    } = params

    return [
      {
        type: action === 'hold' ? BalanceChangeType.HOLD_IN : BalanceChangeType.RELEASE_HOLD_IN,
        intentType: paymentId ? IntentType.PAYMENT : null,
        intentId: paymentId ?? null,
        operationType,
        platformAccountId,
        integrationAccount,
        currency,
        integration,
        amount,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          relatedIntentType: payoutId ? IntentType.PAYOUT : undefined,
          relatedIntentId: payoutId,
          reason,
          txStatus,
        },
      },
    ]
  }
}
