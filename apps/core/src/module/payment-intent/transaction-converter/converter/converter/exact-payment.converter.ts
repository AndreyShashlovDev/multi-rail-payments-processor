import { FeePaymentOperation } from '../operation/fee-payment.operation'
import { PaymentOperation } from '../operation/payment.operation'
import { BasicPaymentConverter } from '../basic-payment-converter'
import { PaymentPriority, PaymentConverterPriority } from '../../converter-priority.constants'
import { PaymentTransactionContext } from '../payment-transaction.converter'
import { TransactionStatus, IntentType } from '@app/shared'
import { HoldInPaymentOperation } from '../operation/hold-in-payment.operation'
import { BalanceChangeTxStatus, BalanceChangeReason } from '@app/shared/types/balance-change'
import { TransactionConverterResult } from '../../../../../shared/projection/basic-transaction.converter'

export class ExactPaymentConverter extends BasicPaymentConverter {
  readonly name: string = 'ExactPaymentConverter'
  readonly priority: PaymentPriority = PaymentConverterPriority.EXACT

  constructor(
    private readonly feeOperation: FeePaymentOperation,
    private readonly paymentOperation: PaymentOperation,
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

      if (amount.eq(payment.amount.minus(clientFeeAmount)) && transfer.amount.eq(payment.amount.plus(payerFeeAmount))) {
        return {
          payment,
          transfer,
          feeChanges: changes,
          amount: transfer.amount,
        }
      }

      return null // не подошло
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
        ...this.paymentOperation.execute({
          payment: match.payment,
          amount: match.amount,
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
