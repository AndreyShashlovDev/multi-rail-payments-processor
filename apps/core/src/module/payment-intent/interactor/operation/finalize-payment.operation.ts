import { AbstractInteractor, type UUID, Numeric } from '@app/types'
import { Injectable } from '@nestjs/common'
import { PaymentAmountAccumulatorRepository } from '../../../../data/repository/payment-amount-accumulator/payment-amount-accumulator.repository'
import { PaymentIntentRepository } from '../../../../data/repository/payment-intent/payment-intent.repository'
import { ReceiptRepository } from '../../../../data/repository/receipt/receipt.repository'
import { PaymentIntentStatus } from '../../model/payment-intent.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { IntentType } from '@app/shared'

export interface FinalizePaymentOperationParams {
  readonly paymentIds: ReadonlySet<UUID>
  readonly ctx: TxContext
}

interface PaymentInfoParams {
  readonly id: UUID
  readonly expected: Numeric
  readonly receivedTotal: Numeric
  readonly receiptTotal: Numeric
}

@Injectable()
export class FinalizePaymentOperation extends AbstractInteractor<FinalizePaymentOperationParams, Promise<void>> {
  constructor(
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly paymentAmountAccumulatorRepository: PaymentAmountAccumulatorRepository,
    private readonly paymentReceiptRepository: ReceiptRepository,
  ) {
    super()
  }

  async execute(params: FinalizePaymentOperationParams): Promise<void> {
    if (params.paymentIds.size === 0) {
      return
    }

    const payments = await this.paymentIntentRepository.findByIds(params.paymentIds, params.ctx)
    const received = await this.paymentAmountAccumulatorRepository.sumAmountByPaymentIds(params.paymentIds, params.ctx)
    const receipt = await this.paymentReceiptRepository.sumAmountByIntentIds(
      { intentIds: params.paymentIds, intentType: IntentType.PAYMENT },
      params.ctx,
    )

    const paymentsMap = new Map(payments.map((payment) => [payment.id, payment]))

    const paymentInfoParams = Array.from(params.paymentIds)
      .map((id) => ({
        id,
        expected: paymentsMap.get(id)?.amount,
        receivedTotal: received.get(id),
        receiptTotal: receipt.get(id),
      }))
      .filter(
        (info) => info.expected !== undefined && info.receivedTotal !== undefined && info.receiptTotal !== undefined,
      ) as ReadonlyArray<PaymentInfoParams>

    const paymentStatuses = paymentInfoParams
      .map((params) => ({ id: params.id, status: this.determineStatus(params) }))
      .filter((item) => item.status) as ReadonlyArray<{ id: UUID; status: PaymentIntentStatus }>

    const changedPaymentIds = new Set(Array.from(paymentStatuses.values()).map((item) => item.id))

    await this.paymentIntentRepository.changeStatusBulk(paymentStatuses, params.ctx)
    await this.paymentAmountAccumulatorRepository.deleteByPaymentIds(changedPaymentIds, params.ctx)
  }

  private determineStatus(params: PaymentInfoParams): PaymentIntentStatus | null {
    if (!params.receiptTotal.eq(params.receivedTotal)) {
      return null // wait until finalize all transfers
    }

    if (params.expected.eq(params.receiptTotal)) {
      return PaymentIntentStatus.EXACT
    } else if (params.expected.lt(params.receiptTotal)) {
      return PaymentIntentStatus.OVERPAY
    } else {
      return PaymentIntentStatus.UNDERPAY
    }
  }
}
