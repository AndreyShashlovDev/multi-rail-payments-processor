import { PaymentIntentRepository } from '../../../../data/repository/payment-intent/payment-intent.repository'
import { PaymentIntentStatus } from '../../model/payment-intent.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransactionModel } from '../../../../shared/model/transaction.model'
import { TransactionHandler } from '../../../../shared/transaction-handler/transaction-handler'

export class AcceptedHandler implements TransactionHandler {
  constructor(private readonly paymentIntentRepository: PaymentIntentRepository) {}

  async process(data: TransactionModel, ctx: TxContext): Promise<void> {
    const payments = await this.paymentIntentRepository.findActiveByParams(
      {
        integration: data.integration,
        status: PaymentIntentStatus.CREATED,
        params: data.transfers.map((transfer) => ({
          to: transfer.to,
          currency: transfer.currency,
        })),
      },
      ctx,
    )

    const paymentIds = payments.map((item) => item.id)

    if (paymentIds.length > 0) {
      await this.paymentIntentRepository.markAsConfirmingBulk(new Set(paymentIds), ctx)
    }
  }
}
