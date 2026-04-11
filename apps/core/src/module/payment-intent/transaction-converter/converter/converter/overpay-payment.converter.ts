import { FeePaymentOperation } from '../operation/fee-payment.operation'
import { PaymentOperation } from '../operation/payment.operation'
import { OverpayPaymentOperation } from '../operation/overpay-payment.operation'
import { PaymentPriority, PaymentConverterPriority } from '../../converter-priority.constants'
import { BasicPaymentConverter } from '../basic-payment-converter'
import { PaymentTransactionContext } from '../payment-transaction.converter'
import { HoldInPaymentOperation } from '../operation/hold-in-payment.operation'
import { TransactionStatus, IntentType } from '@app/shared'
import { BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { Id } from '@app/types'
import { TransactionConverterResult } from '../../../../../shared/projection/basic-transaction.converter'

export class OverpayPaymentConverter extends BasicPaymentConverter {
  readonly name: string = 'OverpayPaymentConverter'
  readonly priority: PaymentPriority = PaymentConverterPriority.OVERPAY

  constructor(
    private readonly feeOperation: FeePaymentOperation,
    private readonly paymentOperation: PaymentOperation,
    private readonly overpayOperation: OverpayPaymentOperation,
    private readonly holdInOperation: HoldInPaymentOperation,
  ) {
    super()
  }

  execute(params: PaymentTransactionContext): TransactionConverterResult<PaymentTransactionContext> {
    const { matches, unusedPayments, unusedTransfers } = this.matchPairs(params, (payment, transfer) => {
      const { amount, clientFeeAmount, payerFeeAmount, changes } = this.feeOperation.execute({
        payment,
        tx: params.transaction,
        transferIds: new Set([transfer.id]),
        transferAmount: transfer.amount,
      })

      if (
        amount.gte(payment.amount.minus(clientFeeAmount)) &&
        transfer.amount.gte(payment.amount.plus(payerFeeAmount))
      ) {
        return {
          payment,
          transfer,
          feeChanges: changes,
          amount: transfer.amount,
          overpay: transfer.amount.minus(payment.amount.plus(payerFeeAmount)),
        }
      }

      return null
    })

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
        ...match.feeChanges,
        ...this.paymentOperation.execute({
          payment: match.payment,
          amount: match.amount,
          tx: params.transaction,
          transferIds: new Set<Id>([match.transfer.id]),
        }),
        ...this.overpayOperation.execute({
          payment: match.payment,
          tx: params.transaction,
          transferIds: new Set<Id>([match.transfer.id]),
          transferAmount: match.transfer.amount,
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
