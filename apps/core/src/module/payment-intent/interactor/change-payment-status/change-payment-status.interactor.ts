import { AbstractInteractor, UUID, Id } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { TxContextRunner, BalanceChangeType, IntentType } from '@app/shared'
import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PaymentBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { ReceiptRepository } from '../../../../data/repository/receipt/receipt.repository'
import { TxContext } from '@app/shared/types/tx-context.type'
import { PaymentReceiptData } from '../../model/payment-receipt.model'
import { FinalizePaymentOperation } from '../operation/finalize-payment.operation'
import { BalanceUpdatedResult } from '../../../../data/consumer/ledger/ledger-consumer.types'

export interface ChangePaymentStatusParams {
  readonly data: BalanceUpdatedResult<PaymentBalanceChangeMetadata>
}

@Injectable()
export class ChangePaymentStatusInteractor extends AbstractInteractor<ChangePaymentStatusParams, Promise<void>> {
  private readonly logger: Logger = new Logger(ChangePaymentStatusInteractor.name)

  constructor(
    private readonly txContextRunner: TxContextRunner,
    private readonly finalizePaymentOperation: FinalizePaymentOperation,
    private readonly paymentReceipt: ReceiptRepository,
    private readonly inboxRepository: InboxRepository,
  ) {
    super()
  }

  async execute(params: ChangePaymentStatusParams): Promise<void> {
    const { data } = params

    await this.txContextRunner
      .create()
      .pipeline(async (ctx) => {
        if (
          !(await this.inboxRepository.create(
            { serviceName: ChangePaymentStatusInteractor.name, idempotencyKey: params.data.idempotencyKey },
            ctx,
          ))
        ) {
          return
        }

        const changeByPayment = Map.groupBy(data.changes, (change) => change.intentId as UUID)

        const paymentIds: Set<UUID> = new Set<UUID>()

        for (const [id, changes] of changeByPayment.entries()) {
          const underpay = changes.find(
            (item) =>
              item.type === BalanceChangeType.CREDIT &&
              item.metadata.reason === BalanceChangeReason.UNDERPAY &&
              item.metadata.txStatus === BalanceChangeTxStatus.TX_CONFIRMED,
          )

          const overpay = changes.find(
            (item) =>
              item.type === BalanceChangeType.HOLD &&
              item.metadata.reason === BalanceChangeReason.OVERPAY &&
              item.metadata.txStatus === BalanceChangeTxStatus.TX_CONFIRMED,
          )

          const payment = changes.find(
            (item) =>
              item.type === BalanceChangeType.CREDIT &&
              item.metadata.reason === BalanceChangeReason.AMOUNT &&
              item.metadata.txStatus === BalanceChangeTxStatus.TX_CONFIRMED,
          )

          if (overpay || payment) {
            paymentIds.add(id)
          }

          const receiptPayment = underpay ?? overpay ?? payment

          if (receiptPayment) {
            await this.createReceipt(receiptPayment, ctx)
          }
        }

        await this.finalizePaymentOperation.execute({ paymentIds, ctx })
      })
      .execute()
  }

  private async createReceipt(payment: BalanceChange<PaymentBalanceChangeMetadata>, ctx: TxContext): Promise<void> {
    const { txId, transferIds, sourceTxId, executedAt } = payment.metadata

    if (!executedAt) {
      throw new Error(`Create receipt executedAt is empty, tx id: ${txId}`)
    }

    const receipt: PaymentReceiptData = {
      intentId: payment.intentId as UUID,
      amount: payment.amount,
      txId,
      transferIds: new Set<Id>(transferIds),
      currency: payment.currency,
      integration: payment.integration,
      sourceTxId,
      executedAt,
    }

    await this.paymentReceipt.create({ ...receipt, intentType: IntentType.PAYMENT }, ctx)
  }
}
