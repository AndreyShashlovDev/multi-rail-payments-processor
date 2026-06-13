import { AbstractInteractor, IntegrationCurrency, Numeric, UUID, RawNumeric, IntegrationAccount } from '@app/types'
import {
  PaymentIntentModel,
  PaymentPlatformFeePayerType,
  PaymentOperationType,
} from '../../../module/payment-intent/model/payment-intent.model'
import { Injectable } from '@nestjs/common'
import { IntegrationType } from '@app/shared'
import { CreatePaymentIntentInteractor } from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent.interactor'
import { CurrencyRepository } from '../../../data/repository/currency/currency.repository'
import { IntegrationAccountLinkRepository } from '../../../data/repository/integration-account-link/integration-account-link.repository'
import { isUUID } from 'class-validator'

export interface CreatePaymentResolverParams {
  readonly idempotencyKey: string
  readonly platformAccountId: UUID | null
  readonly userId: UUID | null
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly amount: RawNumeric
  readonly from: IntegrationAccount | null
  readonly to: IntegrationAccount | null
  readonly platformFeePayer: PaymentPlatformFeePayerType | null
}

@Injectable()
export class CreatePaymentResolverInteractor extends AbstractInteractor<
  CreatePaymentResolverParams,
  Promise<PaymentIntentModel>
> {
  constructor(
    private readonly createPaymentIntentInteractor: CreatePaymentIntentInteractor,
    private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository,
    private readonly currencyRepository: CurrencyRepository,
  ) {
    super()
  }

  async execute(params: CreatePaymentResolverParams): Promise<PaymentIntentModel> {
    // fixme Right now, we're only calling from the integration service, so this will be a hard-coded situation. Take this into account when forwarding the method to the gateway.

    // from integration, we receive raw amount with exponent.
    const exponents = await this.currencyRepository.getExponents()
    const currentExponentValue = exponents.get(params.integration)?.get(params.currency)

    if (!currentExponentValue) {
      // todo
      throw new Error(`Unknown currency! integration: ${params.integration}, currency: ${params.currency}`)
    }

    const amount = Numeric.fromExponent(params.amount, currentExponentValue)
    const targetLink = isUUID(params.to)
      ? await this.integrationAccountLinkRepository.getByPlatformAccount({
          integration: params.integration,
          platformAccountId: params.to as UUID,
          currency: params.currency,
        })
      : (
          await this.integrationAccountLinkRepository.getActive({
            integration: params.integration,
            accounts: new Set([params.to!]),
          })
        )[0]

    if (!targetLink) {
      // todo
      throw new Error(`relayer account link not found! by account ${params.to}`)
    }

    return await this.createPaymentIntentInteractor.execute({
      ...params,
      operationType: PaymentOperationType.RELAYER,
      platformAccountId: targetLink.platformAccountId,
      userId: targetLink.userId,
      amount,
      to: targetLink,
    })
  }
}
