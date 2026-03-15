import { UnderpayPaymentOperation } from '../operation/underpay-payment.operation'
import { PaymentPriority, PaymentConverterPriority } from '../../converter-priority.constants'
import { BasicPaymentConverter } from '../basic-payment-converter'
import { PaymentTransactionContext } from '../payment-transaction.converter'
import { TransactionConverterResult } from '../../basic-transaction.converter'
import { HoldInPaymentOperation } from '../operation/hold-in-payment.operation'
import { PaymentPlatformFeePayerType } from '../../../../payment-intent/model/payment-intent.model'
import { Numeric } from '@app/types'
import { TransactionStatus, IntentType } from '@app/shared'
import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'

export class UnderpayPaymentConverter extends BasicPaymentConverter {
  readonly name: string = 'UnderpayPaymentConverter'
  readonly priority: PaymentPriority = PaymentConverterPriority.UNDERPAY

  constructor(
    private readonly underpayOperation: UnderpayPaymentOperation,
    private readonly holdInOperation: HoldInPaymentOperation,
  ) {
    super()
  }

  execute(params: PaymentTransactionContext): TransactionConverterResult<PaymentTransactionContext> {
    const { matches, unusedPayments, unusedTransfers } = this.matchPairs(params, (payment, transfer) => {
      const expectedAmount = payment.amount.plus(
        payment.platformFeePayer === PaymentPlatformFeePayerType.PAYER
          ? (payment.platformFee ?? Numeric.ZERO)
          : Numeric.ZERO,
      )

      if (transfer.amount.gte(expectedAmount)) {
        return null
      }

      const holdIn = this.holdInOperation.execute(
        HoldInPaymentOperation.createParamsByPayment({
          payment,
          amount: transfer.amount,
          txId: params.transaction.id,
          transferIds: new Set([transfer.id]),
          payoutId: transfer.intent?.intentType === IntentType.PAYOUT ? transfer.intent.intentId : undefined,
          action: params.transaction.status === TransactionStatus.ACCEPTED ? 'hold' : 'release',
          reason: BalanceChangeReason.UNDERPAY,
          txStatus:
            params.transaction.status === TransactionStatus.ACCEPTED
              ? BalanceChangeTxStatus.TX_ACCEPTED
              : BalanceChangeTxStatus.TX_CONFIRMED,
        }),
      )
      const underpay: BalanceChange[] = []

      if (params.transaction.status === TransactionStatus.CONFIRMED) {
        underpay.push(
          ...this.underpayOperation.execute({
            payment,
            txId: params.transaction.id,
            transferIds: new Set([transfer.id]),
            amount: transfer.amount,
            expectedAmount,
          }),
        )
      }

      const changes = [...holdIn, ...underpay]

      if (changes.length > 0) {
        return { payment, transfer, changes }
      }

      return null
    })

    const allChanges = matches.flatMap((match) => match.changes)

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
