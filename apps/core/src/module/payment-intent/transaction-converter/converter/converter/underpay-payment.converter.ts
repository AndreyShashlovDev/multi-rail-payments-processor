import { UnderpayPaymentOperation } from '../operation/underpay-payment.operation'
import { PaymentPriority, PaymentConverterPriority } from '../../converter-priority.constants'
import { BasicPaymentConverter } from '../basic-payment-converter'
import { PaymentTransactionContext } from '../payment-transaction.converter'
import { HoldInPaymentOperation } from '../operation/hold-in-payment.operation'
import { TransactionStatus, IntentType } from '@app/shared'
import { BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { TransactionConverterResult } from '../../../../../shared/projection/basic-transaction.converter'
import { FeePaymentOperation } from '../operation/fee-payment.operation'

export class UnderpayPaymentConverter extends BasicPaymentConverter {
  readonly name: string = 'UnderpayPaymentConverter'
  readonly priority: PaymentPriority = PaymentConverterPriority.UNDERPAY

  constructor(
    private readonly feeOperation: FeePaymentOperation,
    private readonly underpayOperation: UnderpayPaymentOperation,
    private readonly holdInOperation: HoldInPaymentOperation,
  ) {
    super()
  }

  execute(params: PaymentTransactionContext): TransactionConverterResult<PaymentTransactionContext> {
    const { matches, unusedPayments, unusedTransfers } = this.matchPairs(
      params,
      (payment, transfer, accumulatedAmountNet, accumulatedAmountGross) => {
        const { amount, clientFeeAmount, payerFeeAmount, changes } = this.feeOperation.execute({
          payment,
          tx: params.transaction,
          transferIds: new Set([transfer.id]),
          transferAmount: transfer.amount,
          accumulatedAmount: accumulatedAmountNet,
          feeCurrency: params.currencies.get(payment.currency)!,
        })

        const totalAmountNet = amount.plus(accumulatedAmountNet)
        const totalAmountGross = transfer.amount.plus(accumulatedAmountGross)

        if (
          totalAmountNet.lt(payment.amount.minus(clientFeeAmount)) &&
          totalAmountGross.lt(payment.amount.plus(payerFeeAmount))
        ) {
          return {
            payment,
            transfer,
            feeChanges: changes,
            amount: transfer.amount,
            expectedAmount: payment.amount.plus(payerFeeAmount).minus(accumulatedAmountGross),
          }
        }

        return null
      },
    )

    const allChanges = matches.flatMap((match) => {
      const holdIn = this.holdInOperation.execute(
        HoldInPaymentOperation.createParamsByPayment({
          payment: match.payment,
          amount: match.amount,
          tx: params.transaction,
          transferIds: new Set([match.transfer.id]),
          payoutId:
            match.transfer.intent?.intentType === IntentType.PAYOUT ? match.transfer.intent.intentId : undefined,
          action: params.transaction.status === TransactionStatus.ACCEPTED ? 'hold' : 'release',
          reason: BalanceChangeReason.AMOUNT,
          txStatus:
            params.transaction.status === TransactionStatus.ACCEPTED
              ? BalanceChangeTxStatus.TX_ACCEPTED
              : BalanceChangeTxStatus.TX_CONFIRMED,
        }),
      )

      if (params.transaction.status === TransactionStatus.ACCEPTED) {
        return [...holdIn]
      }

      return [
        ...holdIn,
        ...match.feeChanges,
        ...this.underpayOperation.execute({
          payment: match.payment,
          amount: match.transfer.amount,
          expectedAmount: match.expectedAmount,
          tx: params.transaction,
          transferIds: new Set([match.transfer.id]),
          payoutId:
            match.transfer.intent?.intentType === IntentType.PAYOUT ? match.transfer.intent.intentId : undefined,
        }),
      ]
    })

    return {
      context: {
        ...params,
        paymentIntents: unusedPayments,
        transfers: unusedTransfers,
      },
      changes: allChanges,
    }
  }
}
