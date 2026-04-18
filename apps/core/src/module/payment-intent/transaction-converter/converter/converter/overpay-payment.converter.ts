import { FeePaymentOperation } from '../operation/fee-payment.operation'
import { OverpayPaymentOperation } from '../operation/overpay-payment.operation'
import { PaymentPriority, PaymentConverterPriority } from '../../converter-priority.constants'
import { BasicPaymentConverter } from '../basic-payment-converter'
import { PaymentTransactionContext } from '../payment-transaction.converter'
import { HoldInPaymentOperation } from '../operation/hold-in-payment.operation'
import { TransactionStatus, IntentType } from '@app/shared'
import { BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { Id } from '@app/types'
import { TransactionConverterResult } from '../../../../../shared/projection/basic-transaction.converter'
import { Logger } from '@nestjs/common'

export class OverpayPaymentConverter extends BasicPaymentConverter {
  readonly name: string = 'OverpayPaymentConverter'
  readonly priority: PaymentPriority = PaymentConverterPriority.OVERPAY

  private readonly logger = new Logger(OverpayPaymentConverter.name)

  constructor(
    private readonly feeOperation: FeePaymentOperation,
    private readonly overpayOperation: OverpayPaymentOperation,
    private readonly holdInOperation: HoldInPaymentOperation,
  ) {
    super()
  }

  execute(params: PaymentTransactionContext): TransactionConverterResult<PaymentTransactionContext> {
    const { matches, unusedPayments, unusedTransfers } = this.matchPairs(
      params,
      (payment, transfer, accumulatedAmountNet, accumulatedAmountGross) => {
        const { amount, clientFeeAmount, payerFeeAmount } = this.feeOperation.execute({
          payment,
          tx: params.transaction,
          transferIds: new Set([transfer.id]),
          transferAmount: transfer.amount,
          accumulatedAmount: accumulatedAmountNet,
          feeCurrency: params.currencies.get(payment.currency)!,
        })

        if (accumulatedAmountGross.gte(payment.amount.plus(payerFeeAmount))) {
          this.logger.debug(
            `Payment already overpay. gross ${accumulatedAmountGross.toString()}. amount ${payment.amount.plus(payerFeeAmount).toString()}`,
          )
          return null
        }

        const totalAmountNet = amount.plus(accumulatedAmountNet)
        const totalAmountGross = transfer.amount.plus(accumulatedAmountGross)

        if (
          totalAmountNet.gte(payment.amount.minus(clientFeeAmount)) &&
          totalAmountGross.gte(payment.amount.plus(payerFeeAmount))
        ) {
          return {
            payment,
            transfer,
            amount: transfer.amount,
            expectedAmount: payment.amount.minus(accumulatedAmountGross).plus(payerFeeAmount),
            overpay: totalAmountGross.minus(payment.amount.plus(payerFeeAmount)),
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
          reason: BalanceChangeReason.OVERPAY,
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
        ...this.overpayOperation.execute({
          payment: match.payment,
          tx: params.transaction,
          transferIds: new Set<Id>([match.transfer.id]),
          transferAmount: match.amount,
          expectedAmount: match.expectedAmount,
          overpay: match.overpay,
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
