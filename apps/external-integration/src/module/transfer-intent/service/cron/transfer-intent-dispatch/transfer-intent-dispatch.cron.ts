import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { DispatchTransferIntentInteractor } from '../../../interactor/dispatch-transfer-intent/dispatch-transfer-intent.interactor'
import { CronExpression, Cron, SchedulerRegistry } from '@nestjs/schedule'

@Injectable()
export class TransferIntentDispatchCron implements OnModuleDestroy {
  private static readonly JOB = 'transfer-intent-dispatch'

  private readonly logger: Logger = new Logger(TransferIntentDispatchCron.name)

  constructor(
    private readonly dispatchTransferIntentInteractor: DispatchTransferIntentInteractor,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS, { name: TransferIntentDispatchCron.JOB, waitForCompletion: true })
  async dispatchTransferIntent(): Promise<void> {
    try {
      await this.dispatchTransferIntentInteractor.execute()
    } catch (e) {
      this.logger.error(e)
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.schedulerRegistry.getCronJob(TransferIntentDispatchCron.JOB).stop()
  }
}
