import { PaymentIntentModel } from '../../model/payment-intent.model'
import { Id, UUID, Numeric, IntegrationCurrency } from '@app/types'
import { PaymentTransactionConverter, PaymentTransactionContext } from './payment-transaction.converter'
import { PaymentPriority } from '../converter-priority.constants'
import { TransferModel } from '../../../../shared/model/transfer.model'
import { TransactionConverterResult } from '../../../../shared/projection/basic-transaction.converter'
import { PaymentAmountAccumulatorModel } from '../../model/payment-amount-accumulator.model'
import { PaymentFeeCalculate } from './payment-fee-calculate'
import { IntegrationCurrencyModel } from '../../../../shared/model/integration-currency.model'

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

  private getTransferredAmountWithoutFee(
    payment: PaymentIntentModel,
    amounts: ReadonlyArray<PaymentAmountAccumulatorModel>,
    currencies: ReadonlyMap<IntegrationCurrency, IntegrationCurrencyModel>,
  ): Numeric {
    if (!amounts.length) return Numeric.ZERO

    let accumulatedSoFar = Numeric.ZERO
    const minorUnit = currencies.get(payment.currency)!.minorUnit

    const { total, totalFee } = amounts.reduce(
      (acc, item) => {
        const fee = PaymentFeeCalculate(payment, item.amount, accumulatedSoFar, minorUnit)
        accumulatedSoFar = accumulatedSoFar.plus(item.amount)

        return {
          total: acc.total.plus(item.amount),
          totalFee: acc.totalFee.plus(fee),
        }
      },
      { total: Numeric.ZERO, totalFee: Numeric.ZERO },
    )

    return total.minus(totalFee)
  }

  protected matchPairs<TMatch>(
    params: PaymentTransactionContext,
    matchFn: (
      payment: PaymentIntentModel,
      transfer: TransferModel,
      accumulatedAmountNet: Numeric,
      accumulatedAmountGross: Numeric,
    ) => TMatch | null,
  ): {
    matches: TMatch[]
    unusedPayments: ReadonlyArray<PaymentIntentModel>
    unusedTransfers: ReadonlyArray<TransferModel>
  } {
    const { payments, transfers } = this.preparePaymentsAndTransfers(params)
    const usedTransfers = new Set<Id>()
    const usedPayments = new Set<UUID>()
    const matches: TMatch[] = []

    for (const transfer of transfers) {
      const prioritizedPayments = Array.from(payments).sort((a, b) => {
        const aHasFrom = (params.amounts.get(a.id) ?? []).some((item) => item.from === transfer.from)
        const bHasFrom = (params.amounts.get(b.id) ?? []).some((item) => item.from === transfer.from)

        if (aHasFrom && !bHasFrom) return -1
        if (!aHasFrom && bHasFrom) return 1

        return a.createdAt.getTime() - b.createdAt.getTime()
      })

      for (const payment of prioritizedPayments) {
        if (usedTransfers.has(transfer.id)) break
        if (usedPayments.has(payment.id)) continue
        if (transfer.currency !== payment.currency) continue
        if (transfer.to !== payment.to.account && transfer.to !== payment.to.platformAccountId) continue

        const transferredAmounts = params.amounts.get(payment.id) ?? []
        const accumulatedAmountGross = transferredAmounts.reduce(
          (acc, item) => acc.plus(item.amount),
          Numeric.create(0),
        )
        const accumulatedAmountNet = this.getTransferredAmountWithoutFee(payment, transferredAmounts, params.currencies)

        const match = matchFn(payment, transfer, accumulatedAmountNet, accumulatedAmountGross)

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
