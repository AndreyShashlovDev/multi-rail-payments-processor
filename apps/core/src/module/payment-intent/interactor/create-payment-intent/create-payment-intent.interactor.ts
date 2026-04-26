import { AbstractInteractor, UUID, IntegrationCurrency, Numeric } from '@app/types'
import { PaymentIntentModel, PaymentPlatformFeePayerType, PaymentOperationType } from '../../model/payment-intent.model'
import { PaymentIntentRepository } from '../../../../data/repository/payment-intent/payment-intent.repository'
import { Injectable } from '@nestjs/common'
import { IntegrationAccountLinkRepository } from '../../../../data/repository/integration-account-link/integration-account-link.repository'
import { IntegrationType, TxContextRunner } from '@app/shared'
import { IntegrationAccountRepository } from '../../../../data/repository/integration-account/integration-account.repository'
import { IntegrationAccountLinkModel } from '../../../../shared/model/integration-account-link.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { PlatformFeeProvider } from '../../../../shared/platform-fee/platform-fee.provider'
import { NotFoundAvailableLinkAccountException } from '../../exception/not-found-available-link-account.exception'

export interface CreatePaymentParams {
  readonly operationType: PaymentOperationType
  readonly platformAccountId: UUID
  readonly userId: UUID
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly amount: Numeric
  // PaymentPlatformFeePayerModelType.CLIENT by default
  readonly platformFeePayer?: PaymentPlatformFeePayerType
}

@Injectable()
export class CreatePaymentIntentInteractor extends AbstractInteractor<
  CreatePaymentParams,
  Promise<PaymentIntentModel>
> {
  constructor(
    private readonly txContextRunner: TxContextRunner,
    private readonly paymentRepository: PaymentIntentRepository,
    private readonly integrationAccountRepository: IntegrationAccountRepository,
    private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository,
    private readonly platformFeeProvider: PlatformFeeProvider,
  ) {
    super()
  }

  async execute(params: CreatePaymentParams): Promise<PaymentIntentModel> {
    const { platformFee, platformFeeAccount } = await this.platformFeeProvider.execute({
      integration: params.integration,
      currency: params.currency,
    })

    // todo idempotencyKey check need
    const result = await this.txContextRunner
      .createWithData<{ accountLink: IntegrationAccountLinkModel; payment?: PaymentIntentModel }>()
      .pipeline(async (ctx) => await this.prepareAccountForPayment(params, ctx))
      .pipeline(async (ctx, data) => {
        const payment = await this.paymentRepository.create(
          {
            ...params,
            member: {
              accountId: params.platformAccountId,
              userId: params.userId,
            },
            fromPlatformAccountId: null,
            fromIntegrationAccount: null,
            to: {
              account: data.accountLink.integrationAccount.account,
              platformAccountId: data.accountLink.platformAccountId,
              accountLinkId: data.accountLink.id,
            },
            platformFeePayer: params.platformFeePayer ?? PaymentPlatformFeePayerType.CLIENT,
            platformFee,
            platformFeeAccount: platformFeeAccount
              ? {
                  account: platformFeeAccount.integrationAccount.account,
                  platformAccountId: platformFeeAccount.platformAccountId,
                  accountLinkId: platformFeeAccount.id,
                }
              : null,
          },
          ctx,
        )

        return { ...data, payment }
      })
      .execute()

    return result.payment!
  }

  private async prepareAccountForPayment(
    data: {
      readonly platformAccountId: UUID
      readonly userId: UUID
      readonly integration: IntegrationType
      readonly currency: IntegrationCurrency
    },
    ctx: TxContext,
  ): Promise<{ accountLink: IntegrationAccountLinkModel }> {
    const integrationAccount = await this.integrationAccountRepository.makeUseAccount(
      { integration: data.integration, currency: data.currency },
      ctx,
    )

    if (!integrationAccount) {
      throw new NotFoundAvailableLinkAccountException(data.integration, data.currency)
    }

    const accountLink = await this.integrationAccountLinkRepository.assignAccount(
      {
        integrationAccount,
        platformAccountId: data.platformAccountId,
        userId: data.userId,
      },
      ctx,
    )

    return { accountLink }
  }
}
