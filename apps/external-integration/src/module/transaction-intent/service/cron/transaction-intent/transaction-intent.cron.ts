import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import {
  CreateTransactionIntentInteractor,
} from '../../../interactor/create-transaction-intent/create-transaction-intent.interactor'
import { CronExpression, Cron } from '@nestjs/schedule'

@Injectable()
export class TransactionIntentCron implements OnModuleDestroy {
  private static GRACEFUL_SHUTDOWN_CHECK_INTERVAL_MS: number = 500

  private static readonly task: Set<string> = new Set()
  private static gracefulShutdown: boolean = false

  constructor(
    private readonly logger: Logger,
    private readonly createTransactionIntentInteractor: CreateTransactionIntentInteractor,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async prepareTransactionIntent(): Promise<void> {
    if (TransactionIntentCron.task.has(this.prepareTransactionIntent.name)) {
      this.logger.debug(`skip ${this.prepareTransactionIntent.name}! already running!`)
      return
    }

    TransactionIntentCron.task.add(this.prepareTransactionIntent.name)

    if (TransactionIntentCron.gracefulShutdown) {
      this.logger.debug(`skip ${this.prepareTransactionIntent.name}! graceful shutdown!`)
      return
    }

    try {
      await this.createTransactionIntentInteractor.execute()
    } catch (e) {
      this.logger.error(e)
    } finally {
      TransactionIntentCron.task.delete(this.prepareTransactionIntent.name)
    }
  }

  async onModuleDestroy(): Promise<void> {
    TransactionIntentCron.gracefulShutdown = true

    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        this.logger.debug(`graceful shutdown. jobs running: ${Array.from(TransactionIntentCron.task).join(',')}`)

        if (TransactionIntentCron.task.size === 0) {
          clearInterval(timer)
          resolve(undefined)
        }
      }, TransactionIntentCron.GRACEFUL_SHUTDOWN_CHECK_INTERVAL_MS)
    })
  }
}
