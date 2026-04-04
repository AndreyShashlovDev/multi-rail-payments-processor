import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { PaymentIntentModel, PaymentPlatformFeePayerType } from '../../../../payment-intent/model/payment-intent.model'
import { Numeric, Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'

export interface FeePaymentOperationParams {
  readonly payment: PaymentIntentModel
  readonly txId: Id
  readonly transferIds: ReadonlySet<Id>
  readonly transferAmount: Numeric
}

export interface FeePaymentOperationResult {
  readonly amount: Numeric
  readonly payerFeeAmount: Numeric
  readonly clientFeeAmount: Numeric
  readonly changes: ReadonlyArray<BalanceChange>
}

export class FeePaymentOperation extends AbstractInteractor<FeePaymentOperationParams, FeePaymentOperationResult> {
  execute(params: FeePaymentOperationParams): FeePaymentOperationResult {
    const { payment, transferAmount, transferIds, txId } = params
    if (
      !payment.platformFee ||
      payment.platformFee.lte(Numeric.ZERO) ||
      !payment.platformFeePayer ||
      !payment.platformFeeAccount
    ) {
      return { amount: transferAmount, clientFeeAmount: Numeric.ZERO, payerFeeAmount: Numeric.ZERO, changes: [] }
    }

    const isPayerFeePayed = payment.platformFeePayer === PaymentPlatformFeePayerType.PAYER
    const amount = isPayerFeePayed ? transferAmount : payment.amount
    const payerFeeAmount =
      payment.platformFeePayer === PaymentPlatformFeePayerType.PAYER ? payment.platformFee : Numeric.ZERO

    const clientFeeAmount =
      payment.platformFeePayer === PaymentPlatformFeePayerType.CLIENT ? payment.platformFee : Numeric.ZERO

    const isInternalTransfer =
      payment.to.account === payment.member.accountId && payment.integration === IntegrationType.INTERNAL

    const changes: BalanceChange[] = []

    if (isInternalTransfer) {
      changes.push({
        type: BalanceChangeType.PLATFORM_FEE_ACCRUED,
        platformAccountId: payment.to.platformAccountId,
        integrationAccount: null,
        currency: payment.currency,
        integration: payment.integration,
        amount: payment.platformFee,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          intentType: IntentType.PAYMENT,
          intentId: payment.id,
          reason: BalanceChangeReason.PLATFORM_FEE_CONSOLIDATION,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      })
    } else {
      changes.push(
        {
          type: BalanceChangeType.PLATFORM_FEE_ACCRUED,
          platformAccountId: null,
          integrationAccount: payment.to.account,
          currency: payment.currency,
          integration: payment.integration,
          amount: payment.platformFee,
          metadata: {
            txId: txId,
            transferIds: Array.from(transferIds),
            intentType: IntentType.PAYMENT,
            intentId: payment.id,
            reason: BalanceChangeReason.PLATFORM_FEE_CONSOLIDATION,
            txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
          },
        },
        {
          type: BalanceChangeType.DEBIT,
          platformAccountId: payment.to.platformAccountId,
          integrationAccount: null,
          currency: payment.currency,
          integration: payment.integration,
          amount: payment.platformFee,
          metadata: {
            txId: txId,
            transferIds: Array.from(transferIds),
            intentType: IntentType.PAYMENT,
            intentId: payment.id,
            reason: BalanceChangeReason.FEE,
            txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
          },
        },
      )
    }

    return {
      amount: amount.minus(payment.platformFee),
      payerFeeAmount,
      clientFeeAmount,
      changes,
    }
  }
}
