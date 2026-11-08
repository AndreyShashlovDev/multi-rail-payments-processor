import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { CronExpression, Cron, SchedulerRegistry } from '@nestjs/schedule'
import { FinalizePayoutFlowInteractor } from '../../../interactor/finalize-payout-flow/finalize-payout-flow.interactor'

/**
 * todo For test only!!! Delete it
 */
/**
 * @deprecated remove it in real project! just for example. simulation finalize tx
 */
@Injectable()
export class FinalizePayoutFlowCron implements OnModuleDestroy {
  private static readonly JOB = 'finalize-payout-flow'

  private readonly logger: Logger = new Logger(FinalizePayoutFlowCron.name)

  constructor(
    private readonly finalizePayoutFlowInteractor: FinalizePayoutFlowInteractor,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.logger.fatal('Enabled FinalizePayoutFlowCron! Remove it!')
  }

  /**
   * todo For test only!!! Delete it
   */
  @Cron(CronExpression.EVERY_SECOND, { name: FinalizePayoutFlowCron.JOB, waitForCompletion: true })
  async finalizePayoutFlow(): Promise<void> {
    try {
      await this.finalizePayoutFlowInteractor.execute()
    } catch (e) {
      this.logger.error(e)
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.schedulerRegistry.getCronJob(FinalizePayoutFlowCron.JOB).stop()
  }
}
