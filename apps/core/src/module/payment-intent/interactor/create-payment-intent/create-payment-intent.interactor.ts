import { AbstractInteractor, UUID, IntegrationCurrency, Numeric } from '@app/types'
import { PaymentIntentModel, PaymentPlatformFeePayerType, PaymentOperationType } from '../../model/payment-intent.model'
import { PaymentIntentRepository } from '../../../../data/repository/payment-intent/payment-intent.repository'
import { Injectable } from '@nestjs/common'
import { IntegrationAccountLinkRepository } from '../../../../data/repository/integration-account-link/integration-account-link.repository'
import { IntegrationType, TxContextRunner } from '@app/shared'
import { IntegrationAccountRepository } from '../../../../data/repository/integration-account/integration-account.repository'
import { IntegrationAccountLinkModel } from '../../../../shared/model/integration-account-link.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { NotFoundAvailableLinkAccountException } from '../../exception/not-found-available-link-account.exception'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { DuplicateRequestException } from '../../../../shared/exception/duplicate-request.exception'
import { FeeRepository } from '../../../../data/repository/fee/fee.repository'

export interface CreatePaymentParams {
  readonly idempotencyKey: string
  readonly operationType: PaymentOperationType
  readonly platformAccountId: UUID
  readonly userId: UUID
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly amount: Numeric
  readonly platformFeePayer: PaymentPlatformFeePayerType | null
  readonly to: IntegrationAccountLinkModel | null
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
    private readonly feeRepository: FeeRepository,
    private readonly inboxRepository: InboxRepository,
  ) {
    super()
  }

  async execute(params: CreatePaymentParams): Promise<PaymentIntentModel> {
    const { platformFee, platformFeeAccount } =
      params.operationType === PaymentOperationType.USER_REQUEST
        ? await this.feeRepository.getPlatformFee({
            integration: params.integration,
            currency: params.currency,
          })
        : { platformFee: null, platformFeeAccount: null }

    const result = await this.txContextRunner
      .createWithData<{ accountLink: IntegrationAccountLinkModel; payment?: PaymentIntentModel }>()
      .pipeline(async (ctx, data) => {
        const isUniqueRequest = await this.inboxRepository.create(
          {
            serviceName: CreatePaymentIntentInteractor.name,
            idempotencyKey: params.idempotencyKey,
          },
          ctx,
        )

        if (!isUniqueRequest) {
          throw new DuplicateRequestException(params.idempotencyKey)
        }
        return data
      })
      .pipeline(async (ctx) => {
        if (params.to) {
          return { accountLink: params.to }
        }

        return await this.prepareAccountForPayment(params, ctx)
      })
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
            platformFeePayer: params.platformFeePayer,
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
