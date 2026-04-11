import { Id, UUID, Numeric, IntegrationCurrency, IntegrationAccount } from '@app/types'
import { FeePaymentOperation } from '../operation/fee-payment.operation'
import { PaymentIntentModel } from '../../../model/payment-intent.model'
import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { PaymentOperation } from '../operation/payment.operation'
import { PaymentPriority, PaymentConverterPriority } from '../../converter-priority.constants'
import { BasicPaymentConverter } from '../basic-payment-converter'
import { PaymentTransactionContext } from '../payment-transaction.converter'
import { HoldInPaymentOperation } from '../operation/hold-in-payment.operation'
import { TransactionStatus } from '@app/shared'
import { TransferModel } from '../../../../../shared/model/transfer.model'
import { TransactionConverterResult } from '../../../../../shared/projection/basic-transaction.converter'

interface TransferGroup {
  readonly id: number
  readonly latestIndex: number
  readonly totalAmount: Numeric
  readonly transfers: ReadonlyArray<TransferModel>
  readonly currency: IntegrationCurrency
  readonly from: IntegrationAccount
  readonly to: IntegrationAccount
}

export class SequentialExactPaymentConverter extends BasicPaymentConverter {
  readonly name: string = 'SequentialExactPaymentConverter'
  readonly priority: PaymentPriority = PaymentConverterPriority.SEQUENTIAL

  constructor(
    private readonly feeOperation: FeePaymentOperation,
    private readonly paymentOperation: PaymentOperation,
    private readonly holdInOperation: HoldInPaymentOperation,
  ) {
    super()
  }

  execute(params: PaymentTransactionContext): TransactionConverterResult<PaymentTransactionContext> {
    let groupIndex = 0
    const { transfers, payments } = this.preparePaymentsAndTransfers(params)

    const groups = transfers.reduce((acc, curr) => {
      const group = acc.get(groupIndex)

      if (
        !group ||
        curr.index - 1 != group.latestIndex ||
        curr.currency !== group.currency ||
        curr.to !== group.to ||
        curr.from !== group.from
      ) {
        groupIndex++

        return acc.set(groupIndex, {
          id: groupIndex,
          latestIndex: curr.index,
          totalAmount: curr.amount,
          transfers: [curr],
          currency: curr.currency,
          from: curr.from,
          to: curr.to,
        })
      }

      return acc.set(groupIndex, {
        id: groupIndex,
        latestIndex: curr.index,
        totalAmount: group.totalAmount.plus(curr.amount),
        transfers: group.transfers.concat(curr),
        currency: group.currency,
        from: group.from,
        to: group.to,
      })
    }, new Map<number, TransferGroup>())

    const matches: {
      payment: PaymentIntentModel
      transferIds: ReadonlySet<Id>
      changes: ReadonlyArray<BalanceChange>
      amount: Numeric
    }[] = []

    const usedTransfers = new Set<Id>()
    const usedTransfersGroup = new Set<number>()
    const usedPayments = new Set<UUID>()

    for (const payment of payments) {
      for (const transfersGroup of Array.from(groups.values())) {
        if (usedPayments.has(payment.id)) {
          break
        }

        if (
          usedTransfersGroup.has(transfersGroup.id) ||
          payment.currency !== transfersGroup.currency ||
          payment.to.account !== transfersGroup.to
        ) {
          continue
        }

        const { amount, clientFeeAmount, payerFeeAmount, changes } = this.feeOperation.execute({
          payment,
          tx: params.transaction,
          transferIds: new Set(transfersGroup.transfers.map((transfer) => transfer.id)),
          transferAmount: transfersGroup.totalAmount,
        })

        if (
          amount.eq(payment.amount.minus(clientFeeAmount)) &&
          transfersGroup.totalAmount.eq(payment.amount.plus(payerFeeAmount))
        ) {
          const transferIds = new Set(transfersGroup.transfers.map((transfer) => transfer.id))
          transferIds.forEach((transferId) => usedTransfers.add(transferId))

          usedPayments.add(payment.id)

          matches.push({ payment, transferIds, changes, amount: transfersGroup.totalAmount })
        }
      }
    }

    const changes = matches.flatMap((match) => {
      const holdIn = this.holdInOperation.execute(
        HoldInPaymentOperation.createParamsByPayment({
          payment: match.payment,
          amount: match.amount,
          tx: params.transaction,
          transferIds: match.transferIds,
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
        ...match.changes,
        ...this.paymentOperation.execute({
          payment: match.payment,
          amount: match.amount,
          tx: params.transaction,
          transferIds: match.transferIds,
        }),
      ]
    })

    const notUsedPayments = params.paymentIntents.filter((intent) => !usedPayments.has(intent.id))
    const notUserTransfers = params.transfers.filter((transfer) => !usedTransfers.has(transfer.id))

    return {
      context: {
        ...params,
        paymentIntents: notUsedPayments,
        transfers: notUserTransfers,
      },
      changes,
    }
  }
}
