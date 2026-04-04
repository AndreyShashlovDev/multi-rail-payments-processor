import { AbstractInteractor, UUID } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { TxContextRunner, BalanceChangeType, IntentType } from '@app/shared'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { PayoutIntentRepository } from '../../../../data/repository/payout-intent/payout-intent.repository'
import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import {
  ChangePaymentStatusParams,
} from '../../../payment-intent/interactor/change-payment-status/change-payment-status.interactor'
import { BalanceUpdatedResult } from '../../../../data/repository/ledger/ledger-repository.types'
import { PayoutStatusNotChangedException } from '../../exception/payout-status-not-changed.exception'
import {
  ExternalIntegrationRepository,
} from '../../../../data/repository/external-integration/external-integration.repository'

export interface ChangePayoutStatusParams {
  readonly data: BalanceUpdatedResult
}

@Injectable()
export class ChangePayoutStatusInteractor extends AbstractInteractor<ChangePayoutStatusParams, Promise<void>> {
  constructor(
    private readonly txContextRunner: TxContextRunner,
    private readonly payoutIntentRepository: PayoutIntentRepository,
    private readonly inboxRepository: InboxRepository,
    private readonly externalIntegrationRepository: ExternalIntegrationRepository,
    private readonly logger: Logger,
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
    }, new Map<UUID, BalanceChange[]>())

    const pipelineResult = await this.txContextRunner
      .createWithData<{ heldIntentIds: Set<UUID> }>({ heldIntentIds: new Set<UUID>() })
      .pipeline(async (ctx, data) => {
        if (
          !(await this.inboxRepository.create(
            { serviceName: ChangePayoutStatusInteractor.name, idempotencyKey: params.data.idempotencyKey },
            ctx,
          ))
        ) {
          return data
        }

        for (const [id, changes] of changeByPayout.entries()) {
          let wasChangedSuccess: boolean = false

          // we can check just by main amount hold
          const heldEvent = changes.find(
            (item) =>
              item.type === BalanceChangeType.HOLD &&
              item.metadata.reason === BalanceChangeReason.AMOUNT &&
              item.metadata.txStatus === BalanceChangeTxStatus.TX_PREPARED,
          )

          if (heldEvent) {
            wasChangedSuccess = await this.payoutIntentRepository.markAsHeld({ id }, ctx)
            data.heldIntentIds.add(id)
          } else {
            const payment = changes.find(
              (item) =>
                item.type === BalanceChangeType.DEBIT &&
                item.metadata.reason === BalanceChangeReason.AMOUNT &&
                item.metadata.txStatus === BalanceChangeTxStatus.TX_CONFIRMED,
            )

            if (payment) {
              wasChangedSuccess = await this.payoutIntentRepository.markSuccess({ id }, ctx)
              this.logger.debug(`Payout ${id} success payed!`)
            }
          }

          if (!wasChangedSuccess) {
            throw new PayoutStatusNotChangedException(changes)
          }
        }

        return data
      })
      .execute()

    if (pipelineResult.heldIntentIds.size > 0) {
      await this.externalIntegrationRepository.heldTransactionIntent({
        intentType: IntentType.PAYOUT,
        intentIds: Array.from(pipelineResult.heldIntentIds),
      })
    }
  }
}
