import { AbstractInteractor } from '@app/types'
import { Logger, Injectable } from '@nestjs/common'
import { BalanceEventInboxRepository } from '../../../../data/repository/balance-event-inbox/balance-event-inbox.repository'
import { BalanceRepository } from '../../../../data/repository/balance/balance.repository'
import { BalanceChangeData } from '../../model/balance-change.data'
import { IntentGroup, BalanceApplyError } from '../../../../data/repository/balance/balance-repository.types'
import { randomUUID } from 'node:crypto'
import { OutboxTxContextRunner } from '@app/shared'
import { BalanceEventPublisher } from '../../../../data/publisher/balance-event/balance-event.publisher'

export interface ProcessApplyBalanceParams {
  readonly uniqueKey: string
  readonly changes: ReadonlyArray<BalanceChangeData>
}

@Injectable()
export class ProcessApplyBalanceInteractor extends AbstractInteractor<ProcessApplyBalanceParams, Promise<void>> {
  private readonly logger: Logger = new Logger(ProcessApplyBalanceInteractor.name)

  constructor(
    private readonly txContextRunner: OutboxTxContextRunner,
    private readonly balanceEventInboxRepository: BalanceEventInboxRepository,
    private readonly balanceRepository: BalanceRepository,
    private readonly balanceEventPublisher: BalanceEventPublisher,
  ) {
    super()
  }

  async execute({ uniqueKey, changes }: ProcessApplyBalanceParams): Promise<void> {
    const alreadyProcessed = await this.balanceEventInboxRepository.exists(uniqueKey)
    if (alreadyProcessed) return

    const groups = this.groupByIntent(changes)

    await this.txContextRunner
      .create()
      .pipeline(async (ctx) => {
        try {
          await this.balanceEventInboxRepository.create(uniqueKey, ctx)
        } catch {
          this.logger.warn(`event duplicate ${uniqueKey}`)
          return
        }

        const results = await this.balanceRepository.applyFromGroups(groups, ctx)

        const { success, failed } = results.reduce(
          (acc, result) => {
            if (result.status === 'success') {
              acc.success.push(...result.changes)
            } else {
              acc.failed.changes.push(...result.changes)
              acc.failed.errors.push(result.error)
            }
            return acc
          },
          {
            success: [] as BalanceChangeData[],
            failed: { changes: [] as BalanceChangeData[], errors: [] as BalanceApplyError[] },
          },
        )

        await this.balanceEventPublisher.enqueueSuccess({ uniqueKey: `${uniqueKey}:success`, changes: success }, ctx)
        await this.balanceEventPublisher.enqueueFailed({ uniqueKey: `${uniqueKey}:failed`, ...failed }, ctx)
      })
      .execute()
  }

  private groupByIntent(changes: ReadonlyArray<BalanceChangeData>): ReadonlyArray<IntentGroup> {
    const groups = new Map<string, IntentGroup>()

    for (const change of changes) {
      const key = change.intentId ?? `__no_intent__${randomUUID()}`

      if (!groups.has(key)) {
        groups.set(key, { intentId: change.intentId ?? null, changes: [] })
      }

      ;(groups.get(key)!.changes as BalanceChangeData[]).push(change)
    }

    return Array.from(groups.values())
  }
}
