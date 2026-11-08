import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { CronExpression, Cron, SchedulerRegistry } from '@nestjs/schedule'
import { OutboxPublishInteractor } from '../../../interactor/outbox-publish/outbox-publish.interactor'
import { OutboxRepository } from '../../../../data/repository/outbox/outbox.repository'

@Injectable()
export class OutboxPublisherCron implements OnModuleDestroy {
  private static readonly PUBLISH_JOB = 'outbox-publisher.publish'
  private static readonly CLEANUP_JOB = 'outbox-publisher.cleanup'

  private static readonly CLEANUP_OLDER_THEN_SEC = 15 * 24 * 60 * 60 // 15 days

  private readonly logger: Logger = new Logger(OutboxPublisherCron.name)

  constructor(
    private readonly outboxPublishInteractor: OutboxPublishInteractor,
    private readonly outboxRepository: OutboxRepository,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  // waitForCompletion: a tick is skipped (silently) while the previous one is still running
  @Cron(CronExpression.EVERY_5_SECONDS, { name: OutboxPublisherCron.PUBLISH_JOB, waitForCompletion: true })
  async outboxPublish(): Promise<void> {
    try {
      await this.outboxPublishInteractor.execute()
    } catch (e) {
      this.logger.error(e)
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: OutboxPublisherCron.CLEANUP_JOB, waitForCompletion: true })
  async cleanupOldest(): Promise<void> {
    try {
      await this.outboxRepository.deleteOld(OutboxPublisherCron.CLEANUP_OLDER_THEN_SEC)
    } catch (e) {
      this.logger.error(e)
    }
  }

  // Nest deletes cron jobs on shutdown without waiting for a running tick; stop() waits for it
  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      [OutboxPublisherCron.PUBLISH_JOB, OutboxPublisherCron.CLEANUP_JOB].map(
        async (name) => await this.schedulerRegistry.getCronJob(name).stop(),
      ),
    )
  }
}
