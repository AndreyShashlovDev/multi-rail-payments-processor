import { AbstractInteractor, UUID, Id } from '@app/types'
import { BalanceUpdatedResult } from '../../../../data/repository/ledger/ledger-repository.types'
import { Injectable, Logger } from '@nestjs/common'
import { TxContextRunner, BalanceChangeType } from '@app/shared'
import { PaymentIntentRepository } from '../../../../data/repository/payment-intent/payment-intent.repository'
import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PaymentBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { PaymentStatusNotChangedException } from '../../exception/payment-status-not-changed.exception'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { PaymentReceiptRepository } from '../../../../data/repository/payment-receipt/payment-receipt.repository'
import { TxContext } from '@app/shared/types/tx-context.type'
import { PaymentReceiptData } from '../../model/payment-receipt.model'

export interface ChangePaymentStatusParams {
  readonly data: BalanceUpdatedResult<PaymentBalanceChangeMetadata>
}

@Injectable()
export class ChangePaymentStatusInteractor extends AbstractInteractor<ChangePaymentStatusParams, Promise<void>> {
  constructor(
    private readonly txContextRunner: TxContextRunner,
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly paymentReceipt: PaymentReceiptRepository,
    private readonly inboxRepository: InboxRepository,
    private readonly logger: Logger,
  ) {
    super()
  }

  async execute(params: ChangePaymentStatusParams): Promise<void> {
    const { data } = params

    const changeByPayment = data.changes.reduce((prev, curr) => {
      const id = curr.intentId as UUID
      const arr = prev.get(id) ?? []
      arr.push(curr)

      return prev.set(id, arr)
    }, new Map<UUID, BalanceChange<PaymentBalanceChangeMetadata>[]>())

    await this.txContextRunner
      .create()
      .pipeline(async (ctx) => {
        if (
          !(await this.inboxRepository.create(
            { serviceName: ChangePaymentStatusInteractor.name, idempotencyKey: params.data.idempotencyKey },
            ctx,
          ))
        ) {
          return
        }

        for (const [id, changes] of changeByPayment.entries()) {
          let skipThrowError: boolean = true

          const underpay = changes.find(
            (item) =>
              item.type === BalanceChangeType.HOLD &&
              item.metadata.reason === BalanceChangeReason.UNDERPAY &&
              item.metadata.txStatus === BalanceChangeTxStatus.TX_CONFIRMED,
          )
          const overpay = changes.find(
            (item) =>
              item.type === BalanceChangeType.HOLD &&
              item.metadata.reason === BalanceChangeReason.OVERPAY &&
              item.metadata.txStatus === BalanceChangeTxStatus.TX_CONFIRMED,
          )
          const payment = changes.find(
            (item) =>
              item.type === BalanceChangeType.CREDIT && item.metadata.txStatus === BalanceChangeTxStatus.TX_CONFIRMED,
          )

          if (underpay) {
            skipThrowError = await this.paymentIntentRepository.markAsUnderpay({ id }, ctx)
            this.logger.debug(`Payment ${id} Underpay`)
          } else if (overpay) {
            skipThrowError = await this.paymentIntentRepository.markAsOverpay({ id }, ctx)
            this.logger.debug(`Payment ${id} Overpay`)
          } else if (payment) {
            skipThrowError = await this.paymentIntentRepository.markAsCompleted({ id }, ctx)
            this.logger.debug(`Payment ${id} success payed`)
          }

          if (!skipThrowError) {
            throw new PaymentStatusNotChangedException(changes)
          }

          const receiptPayment = underpay ?? overpay ?? payment

          if (receiptPayment) {
            await this.createReceipt(receiptPayment, ctx)
          }
        }
      })
      .execute()
  }

  private async createReceipt(payment: BalanceChange<PaymentBalanceChangeMetadata>, ctx: TxContext): Promise<void> {
    const { txId, transferIds, sourceTxId, executedAt } = payment.metadata

    if (!executedAt) {
      throw new Error(`Create receipt executedAt is empty, tx id: ${txId}`)
    }

    const receipt: PaymentReceiptData = {
      intentId: payment.intentId as UUID,
      amount: payment.amount,
      txId,
      transferIds: new Set<Id>(transferIds),
      currency: payment.currency,
      integration: payment.integration,
      sourceTxId,
      executedAt,
    }

    await this.paymentReceipt.create(receipt, ctx)
  }
}
