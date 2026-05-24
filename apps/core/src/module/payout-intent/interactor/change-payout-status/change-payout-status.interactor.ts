import { AbstractInteractor, UUID, Id } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { BalanceChangeType, IntentType, OutboxTxContextRunner } from '@app/shared'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { PayoutIntentRepository } from '../../../../data/repository/payout-intent/payout-intent.repository'
import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PayoutBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { ChangePaymentStatusParams } from '../../../payment-intent/interactor/change-payment-status/change-payment-status.interactor'
import { PayoutStatusNotChangedException } from '../../exception/payout-status-not-changed.exception'
import { ExternalIntegrationPublisher } from '../../../../data/publisher/external-integration/external-integration.publisher'
import { BalanceUpdatedResult } from '../../../../data/consumer/ledger/ledger-consumer.types'

export interface ChangePayoutStatusParams {
  readonly data: BalanceUpdatedResult<PayoutBalanceChangeMetadata>
}

@Injectable()
export class ChangePayoutStatusInteractor extends AbstractInteractor<ChangePayoutStatusParams, Promise<void>> {
  private readonly logger = new Logger(ChangePayoutStatusInteractor.name)

  constructor(
    private readonly txRunner: OutboxTxContextRunner,
    private readonly payoutIntentRepository: PayoutIntentRepository,
    private readonly inboxRepository: InboxRepository,
    private readonly externalIntegrationPublisher: ExternalIntegrationPublisher,
  ) {
    super()
  }

  async execute(params: ChangePaymentStatusParams): Promise<void> {
    const { data } = params

    const changeByPayout = data.changes.reduce((prev, curr) => {
      const id = curr.intentId as UUID
      const arr = prev.get(id) ?? []
      arr.push(curr)

      return prev.set(id, arr)
    }, new Map<UUID, BalanceChange<PayoutBalanceChangeMetadata>[]>())

    await this.txRunner
      .create()
      .pipeline(async (ctx, data) => {
        if (
          !(await this.inboxRepository.create(
            { serviceName: ChangePayoutStatusInteractor.name, idempotencyKey: params.data.idempotencyKey },
            ctx,
          ))
        ) {
          return data
        }

        const heldIntentData: Map<string, { intentId: UUID; txId: Id }> = new Map()

        for (const [id, changes] of changeByPayout.entries()) {
          let wasChangedSuccess: boolean = false

          // we can check just by main amount hold
          const heldEvents = changes.filter(
            (item) =>
              item.type === BalanceChangeType.HOLD &&
              item.metadata.reason === BalanceChangeReason.AMOUNT &&
              item.metadata.txStatus === BalanceChangeTxStatus.TX_PREPARED,
          )

          if (heldEvents.length) {
            wasChangedSuccess = await this.payoutIntentRepository.markAsHeld({ id }, ctx)
            heldEvents.forEach((item) => {
              const key = `${id}:${item.metadata.txId}`
              heldIntentData.set(key, { intentId: id, txId: item.metadata.txId })
            })
          } else {
            const payout = changes.find(
              (item) =>
                item.type === BalanceChangeType.DEBIT &&
                item.metadata.reason === BalanceChangeReason.AMOUNT &&
                item.metadata.txStatus === BalanceChangeTxStatus.TX_CONFIRMED,
            )

            if (payout) {
              wasChangedSuccess = await this.payoutIntentRepository.markSuccess({ id }, ctx)
              this.logger.debug(`Payout ${id} success payed!`)
            }
          }

          if (!wasChangedSuccess) {
            throw new PayoutStatusNotChangedException(changes)
          }
        }

        if (heldIntentData.size > 0) {
          await this.externalIntegrationPublisher.enqueueTransferHeld(
            {
              intentType: IntentType.PAYOUT,
              intentData: Array.from(heldIntentData.values()),
            },
            ctx,
          )
        }
      })
      .execute()
  }
}
