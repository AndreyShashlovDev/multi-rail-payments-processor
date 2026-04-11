import { PaymentIntentModel } from '../../model/payment-intent.model'
import { Id, UUID } from '@app/types'
import { PaymentTransactionConverter, PaymentTransactionContext } from './payment-transaction.converter'
import { PaymentPriority } from '../converter-priority.constants'
import { TransferModel } from '../../../../shared/model/transfer.model'
import { TransactionConverterResult } from '../../../../shared/projection/basic-transaction.converter'

export abstract class BasicPaymentConverter implements PaymentTransactionConverter {
  abstract readonly name: string
  abstract readonly priority: PaymentPriority

  abstract execute(params: PaymentTransactionContext): TransactionConverterResult<PaymentTransactionContext>

  protected preparePaymentsAndTransfers(data: Pick<PaymentTransactionContext, 'paymentIntents' | 'transfers'>): {
    payments: ReadonlyArray<PaymentIntentModel>
    transfers: ReadonlyArray<TransferModel>
  } {
    const payments = data.paymentIntents.toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const transfers = data.transfers.toSorted((a, b) => a.index - b.index)

    return {
      payments,
      transfers,
    }
  }

  protected matchPairs<TMatch>(
    params: PaymentTransactionContext,
    matchFn: (payment: PaymentIntentModel, transfer: TransferModel) => TMatch | null,
  ): {
    matches: TMatch[]
    unusedPayments: ReadonlyArray<PaymentIntentModel>
    unusedTransfers: ReadonlyArray<TransferModel>
  } {
    const { payments, transfers } = this.preparePaymentsAndTransfers(params)
    const usedTransfers = new Set<Id>()
    const usedPayments = new Set<UUID>()
    const matches: TMatch[] = []

    for (const payment of payments) {
      for (const transfer of transfers) {
        if (usedPayments.has(payment.id)) {
          break
        }

        if (usedTransfers.has(transfer.id)) continue
        if (transfer.currency !== payment.currency) continue
        if (transfer.to !== payment.to.account) continue

        const match = matchFn(payment, transfer)

        if (match !== null) {
          usedTransfers.add(transfer.id)
          usedPayments.add(payment.id)
          matches.push(match)
          break
        }
      }
    }

    return {
      matches,
      unusedPayments: params.paymentIntents.filter((p) => !usedPayments.has(p.id)),
      unusedTransfers: params.transfers.filter((t) => !usedTransfers.has(t.id)),
    }
  }
}
