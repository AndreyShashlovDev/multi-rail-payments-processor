import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { CronExpression, Cron } from '@nestjs/schedule'
import { OutboxPublishInteractor } from '../../../interactor/outbox-publish/outbox-publish.interactor'
import { OutboxRepository } from '../../../../data/repository/outbox/outbox.repository'

@Injectable()
export class OutboxPublisherCron implements OnModuleDestroy {
  private static GRACEFUL_SHUTDOWN_CHECK_INTERVAL_MS: number = 500

  private static readonly task: Set<string> = new Set()
  private static gracefulShutdown: boolean = false

  private static readonly CLEANUP_OLDER_THEN_SEC = 15 * 24 * 60 * 60 // 15 days

  private readonly logger: Logger = new Logger(OutboxPublisherCron.name)

  constructor(
    private readonly outboxPublishInteractor: OutboxPublishInteractor,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async outboxPublish(): Promise<void> {
    if (OutboxPublisherCron.task.has(this.outboxPublish.name)) {
      this.logger.debug(`skip ${this.outboxPublish.name}! already running!`)
      return
    }

    OutboxPublisherCron.task.add(this.outboxPublish.name)

    if (OutboxPublisherCron.gracefulShutdown) {
      this.logger.debug(`skip ${this.outboxPublish.name}! graceful shutdown!`)
      return
    }

    try {
      await this.outboxPublishInteractor.execute()
    } catch (e) {
      this.logger.error(e)
    } finally {
      OutboxPublisherCron.task.delete(this.outboxPublish.name)
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldest(): Promise<void> {
    if (OutboxPublisherCron.task.has(this.cleanupOldest.name)) {
      this.logger.debug(`skip ${this.cleanupOldest.name}! already running!`)
      return
    }

    OutboxPublisherCron.task.add(this.cleanupOldest.name)

    if (OutboxPublisherCron.gracefulShutdown) {
      this.logger.debug(`skip ${this.cleanupOldest.name}! graceful shutdown!`)
      return
    }

    try {
      await this.outboxRepository.deleteOld(OutboxPublisherCron.CLEANUP_OLDER_THEN_SEC)
    } catch (e) {
      this.logger.error(e)
    } finally {
      OutboxPublisherCron.task.delete(this.cleanupOldest.name)
    }
  }

  async onModuleDestroy(): Promise<void> {
    OutboxPublisherCron.gracefulShutdown = true

    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        this.logger.debug(`graceful shutdown. jobs running: ${Array.from(OutboxPublisherCron.task).join(',')}`)

        if (OutboxPublisherCron.task.size === 0) {
          clearInterval(timer)
          resolve(undefined)
        }
      }, OutboxPublisherCron.GRACEFUL_SHUTDOWN_CHECK_INTERVAL_MS)
    })
  }
}
