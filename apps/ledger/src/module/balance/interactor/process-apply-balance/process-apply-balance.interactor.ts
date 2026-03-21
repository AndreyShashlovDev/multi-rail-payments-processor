import { AbstractInteractor } from '@app/types'
import { TxContextRunner } from '@app/shared/context/tx-context-runner'
import { Logger, Injectable } from '@nestjs/common'
import {
  BalanceEventInboxRepository,
} from '../../../../data/repository/balance-event-inbox/balance-event-inbox.repository'
import { BalanceRepository } from '../../../../data/repository/balance/balance.repository'
import { BalanceEventRepository } from '../../../../data/repository/balance-event/balance-event-repository'
import { BalanceChangeData } from '../../model/balance-change.data'

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

    const result = await this.txContextRunner
      .createWithData<{ success: boolean }>()
      .pipeline(async (ctx) => {
        try {
          await this.balanceEventInboxRepository.create(uniqueKey, ctx)
        } catch {
          this.logger.warn(`event duplicate ${uniqueKey}`)
          return { success: false }
        }

        await this.balanceRepository.applyFromChanges(changes, ctx)

        return { success: true }
      })
      .execute()

    if (result.success) {
      await this.balanceEventRepository.publish({ uniqueKey, changes })
    }
  }
}
