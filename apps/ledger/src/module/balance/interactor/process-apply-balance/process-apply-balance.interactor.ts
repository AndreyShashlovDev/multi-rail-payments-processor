import { AbstractInteractor } from '@app/types'
import { TxContextRunner } from '@app/shared/context/tx-context-runner'
import { Logger, Injectable } from '@nestjs/common'
import { BalanceEventInboxRepository } from '../../../../data/repository/balance-event-inbox/balance-event-inbox.repository'
import { BalanceRepository } from '../../../../data/repository/balance/balance.repository'
import { BalanceEventRepository } from '../../../../data/repository/balance-event/balance-event-repository'
import { BalanceChangeData } from '../../model/balance-change.data'
import {
  IntentGroup,
  IntentApplyResult,
  BalanceApplyError,
} from '../../../../data/repository/balance/balance-repository.types'
import { randomUUID } from 'node:crypto'

export interface ProcessApplyBalanceParams {
  readonly uniqueKey: string
  readonly changes: ReadonlyArray<BalanceChangeData>
}

@Injectable()
export class ProcessApplyBalanceInteractor extends AbstractInteractor<ProcessApplyBalanceParams, Promise<void>> {
  constructor(
    private readonly txContextRunner: TxContextRunner,
    private readonly logger: Logger,
    private readonly balanceEventInboxRepository: BalanceEventInboxRepository,
    private readonly balanceRepository: BalanceRepository,
    private readonly balanceEventRepository: BalanceEventRepository,
  ) {
    super()
  }

  async execute({ uniqueKey, changes }: ProcessApplyBalanceParams): Promise<void> {
    const alreadyProcessed = await this.balanceEventInboxRepository.exists(uniqueKey)
    if (alreadyProcessed) return

    const groups = this.groupByIntent(changes)

    const results = await this.txContextRunner
      .create<ReadonlyArray<IntentApplyResult>>()
      .pipeline(async (ctx) => {
        try {
          await this.balanceEventInboxRepository.create(uniqueKey, ctx)
        } catch {
          this.logger.warn(`event duplicate ${uniqueKey}`)
          return []
        }
        return this.balanceRepository.applyFromGroups(groups, ctx)
      })
      .execute()

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

    // todo use outbox pattern
    await Promise.all([
      this.balanceEventRepository.publishSuccess({ uniqueKey, changes: success }),
      this.balanceEventRepository.publishFailed({ uniqueKey, ...failed }),
    ])
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
