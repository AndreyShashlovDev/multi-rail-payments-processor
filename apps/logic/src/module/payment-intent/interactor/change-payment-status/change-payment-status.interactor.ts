import { AbstractInteractor, UUID } from '@app/types'
import { BalanceUpdatedResult } from '../../../../data/repository/ledger/ledger-repository.types'
import { Injectable, Logger } from '@nestjs/common'
import { TxContextRunner, BalanceChangeType } from '@app/shared'
import { PaymentIntentRepository } from '../../../../data/repository/payment-intent/payment-intent.repository'
import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { PaymentStatusNotChangedException } from '../../exception/payment-status-not-changed.exception'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'

export interface ChangePaymentStatusParams {
  readonly data: BalanceUpdatedResult
}

@Injectable()
export class ChangePaymentStatusInteractor extends AbstractInteractor<ChangePaymentStatusParams, Promise<void>> {
  constructor(
    private readonly txContextRunner: TxContextRunner,
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly inboxRepository: InboxRepository,
    private readonly logger: Logger,
  ) {
    super()
  }

  async execute(params: ChangePaymentStatusParams): Promise<void> {
    const { data } = params

    const changeByPayment = data.changes.reduce((prev, curr) => {
      const id = curr.metadata.intentId as UUID
      const arr = prev.get(id) ?? []
      arr.push(curr)

      return prev.set(id, arr)
    }, new Map<UUID, BalanceChange[]>())

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
        }
      })
      .execute()
  }
}
