import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { CronExpression, Cron } from '@nestjs/schedule'
import { FinalizePayoutFlowInteractor } from '../../../interactor/finalize-payout-flow/finalize-payout-flow.interactor'

/**
 * todo For test only!!! Delete it
 */
/**
 * @deprecated remove it in real project! just for example. simulation finalize tx
 */
@Injectable()
export class FinalizePayoutFlowCron implements OnModuleDestroy {
  private static GRACEFUL_SHUTDOWN_CHECK_INTERVAL_MS: number = 500

  private static readonly task: Set<string> = new Set()
  private static gracefulShutdown: boolean = false

  constructor(
    private readonly logger: Logger,
    private readonly finalizePayoutFlowInteractor: FinalizePayoutFlowInteractor,
  ) {
    this.logger.fatal('Enabled FinalizePayoutFlowCron! Remove it!')
  }

  /**
   * todo For test only!!! Delete it
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async finalizePayoutFlow(): Promise<void> {
    if (FinalizePayoutFlowCron.task.has(this.finalizePayoutFlow.name)) {
      this.logger.debug(`skip ${this.finalizePayoutFlow.name}! already running!`)
      return
    }

    FinalizePayoutFlowCron.task.add(this.finalizePayoutFlow.name)

    if (FinalizePayoutFlowCron.gracefulShutdown) {
      this.logger.debug(`skip ${this.finalizePayoutFlow.name}! graceful shutdown!`)
      return
    }

    try {
      await this.finalizePayoutFlowInteractor.execute()
    } catch (e) {
      this.logger.error(e)
    } finally {
      FinalizePayoutFlowCron.task.delete(this.finalizePayoutFlow.name)
    }
  }

  async onModuleDestroy(): Promise<void> {
    FinalizePayoutFlowCron.gracefulShutdown = true

    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        this.logger.debug(`graceful shutdown. jobs running: ${Array.from(FinalizePayoutFlowCron.task).join(',')}`)

        if (FinalizePayoutFlowCron.task.size === 0) {
          clearInterval(timer)
          resolve(undefined)
        }
      }, FinalizePayoutFlowCron.GRACEFUL_SHUTDOWN_CHECK_INTERVAL_MS)
    })
  }
}
