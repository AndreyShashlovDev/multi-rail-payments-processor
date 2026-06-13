import { Controller, Logger } from '@nestjs/common'
import {
  PaymentControllerMethods,
  PaymentController as GrpcPaymentController,
} from '@app/shared/services/core/v1/grpc/generated/core'
import { CreatePaymentQuery, CreatePaymentResponse } from '@app/shared/services/core/v1/grpc/generated/payment'
import { CreatePaymentResolverInteractor } from '../../../application/interactor/create-payment-resolver/create-payment-resolver.interactor'
import { assertIntegrationType } from '@app/shared'
import { IntegrationCurrency, IntegrationAccount } from '@app/types'

@Controller()
@PaymentControllerMethods()
export class PaymentController implements GrpcPaymentController {
  private readonly logger = new Logger(PaymentController.name)

  constructor(private readonly createPaymentResolverInteractor: CreatePaymentResolverInteractor) {}

  // fixme Right now, we're only calling from the integration service, so this will be a hard-coded situation. Take this into account when forwarding the method to the gateway.
  async createPayment(request: CreatePaymentQuery): Promise<CreatePaymentResponse> {
    assertIntegrationType(request.integration)

    const result = await this.createPaymentResolverInteractor.execute({
      idempotencyKey: request.idempotencyKey,
      platformAccountId: null,
      userId: null,
      integration: request.integration,
      currency: request.currency as IntegrationCurrency,
      amount: request.amount,
      platformFeePayer: null,
      from: (request.from as IntegrationAccount) ?? null,
      to: (request.to as IntegrationAccount) ?? null,
    })

    return { id: result.id }
  }
}
