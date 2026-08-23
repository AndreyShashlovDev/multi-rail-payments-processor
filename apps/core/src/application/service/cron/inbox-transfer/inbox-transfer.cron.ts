import { ProcessPaymentTransactionInteractor } from '../../../../module/payment-intent/interactor/process-payment-transaction/process-payment-transaction.interactor'
import { ProcessPayoutTransactionInteractor } from '../../../../module/payout-intent/interactor/process-payout-transaction/process-payout-transaction.interactor'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class InboxTransferCron {
  private readonly logger = new Logger(InboxTransferCron.name)

  constructor(
    private readonly processPayment: ProcessPaymentTransactionInteractor,
    private readonly processPayout: ProcessPayoutTransactionInteractor,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkInboxTransfers(): Promise<void> {
    this.processPayment.execute().catch((e) => this.logger.error(e))
    this.processPayout.execute().catch((e) => this.logger.error(e))
  }
}
