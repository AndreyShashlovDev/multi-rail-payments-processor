import { AbstractInteractor, UUID, IntegrationCurrency, Numeric, IntegrationAccount } from '@app/types'
import { PayoutIntentModel, PayoutOperationType } from '../../model/payout-intent.model'
import { PayoutIntentRepository } from '../../../../data/repository/payout-intent/payout-intent.repository'
import { LedgerRepository } from '../../../../data/repository/ledger/ledger.repository'
import { Injectable } from '@nestjs/common'
import { IntegrationType, IntentType, Balance, OutboxTxContextRunner } from '@app/shared'
import { IntegrationAccountLinkRepository } from '../../../../data/repository/integration-account-link/integration-account-link.repository'
import { EstimatedTransferFeeNotFoundException } from '../../exception/estimated-transfer-fee-not-found.exception'
import { PayoutBalancePolicy } from '../../policy/payout-balance.policy'
import { PlatformMemberModel } from '../../../../shared/model/platform-member.model'
import {
  SourceIntegrationAccount,
  DestinationIntegrationAccount,
} from '../../../../shared/model/composite-integration-account.model'
import { ExternalIntegrationPublisher } from '../../../../data/publisher/external-integration/external-integration.publisher'
import { ExternalIntegrationRepository } from '../../../../data/repository/external-integration/external-integration.repository'
import { CurrencyRepository } from '../../../../data/repository/currency/currency.repository'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { DuplicateRequestException } from '../../../../shared/exception/duplicate-request.exception'
import { RateRepository } from '../../../../data/repository/rate/rate.repository'
import { ConversionRateResult } from '../../../../data/repository/rate/rate-repository.types'
import { FeeRepository } from '../../../../data/repository/fee/fee.repository'
import { PlatformFeeResult } from '../../../../data/repository/fee/fee-repository.types'

export interface CreatePayoutIntentParams {
  readonly idempotencyKey: string
  readonly operationType: PayoutOperationType

  readonly platformMember: PlatformMemberModel
  readonly amount: Numeric
  readonly fromIntegration: IntegrationType
  readonly fromCurrency: IntegrationCurrency

  readonly toAccount: IntegrationAccount
  readonly estimatedTransferFeeId: UUID
}

@Injectable()
export class CreatePayoutIntentInteractor extends AbstractInteractor<
  CreatePayoutIntentParams,
  Promise<PayoutIntentModel>
> {
  constructor(
    private readonly txRunner: OutboxTxContextRunner,
    private readonly payoutIntentRepository: PayoutIntentRepository,
    private readonly externalIntegrationPublisher: ExternalIntegrationPublisher,
    private readonly externalIntegrationRepository: ExternalIntegrationRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly feeRepository: FeeRepository,
    private readonly rateRepository: RateRepository,
    private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository,
    private readonly currencyRepository: CurrencyRepository,
    private readonly inboxRepository: InboxRepository,
  ) {
    super()
  }

  async execute(params: CreatePayoutIntentParams): Promise<PayoutIntentModel> {
    const { to, platformFeeAccount, convertIntegrationFee, platformFee, userBalance } =
      await this.preparePayoutData(params)

    return await this.txRunner
      .create<PayoutIntentModel>()
      .pipeline(async (ctx) => {
        const isUniqueRequest = await this.inboxRepository.create(
          {
            serviceName: CreatePayoutIntentInteractor.name,
            idempotencyKey: params.idempotencyKey,
          },
          ctx,
        )

        if (!isUniqueRequest) {
          throw new DuplicateRequestException(params.idempotencyKey)
        }

        const pendingAmount = await this.payoutIntentRepository.acquireLockAndGetPendingAmount(
          {
            member: params.platformMember,
            fromIntegration: params.fromIntegration,
            fromCurrency: params.fromCurrency,
          },
          ctx,
        )

        PayoutBalancePolicy.validateWithPending(userBalance, pendingAmount, params.amount)

        // todo call some policy for validate payout configuration!
        const payout = await this.payoutIntentRepository.create(
          {
            operationType: params.operationType,
            member: params.platformMember,
            fromAmount: params.amount,
            fromCurrency: params.fromCurrency,
            fromIntegration: params.fromIntegration,
            estimatedFee: convertIntegrationFee.to.amount,
            estimatedFeeCurrency: convertIntegrationFee.from.currency,
            platformFee: platformFee.platformFee,
            platformFeeAccount,
            integrationFeeRate: convertIntegrationFee.to.rate,
            to,
            toAmount: params.amount,
            toCurrency: params.fromCurrency,
            toIntegration: params.fromIntegration,
            exchangeRate: Numeric.create(1), // same currency and same integration
            integrationFeePayer: null,
            integrationFee: null,
            integrationFeeCurrency: convertIntegrationFee.from.currency,
          },
          ctx,
        )

        await this.externalIntegrationPublisher.enqueueTransferCreate(
          {
            transfer: {
              intentId: payout.id,
              intentType: IntentType.PAYOUT,
              estimatedFee: convertIntegrationFee.from.amount,
              feeCurrency: convertIntegrationFee.from.currency,
              fromAmount: payout.fromAmount,
              fromIntegration: payout.fromIntegration,
              fromCurrency: payout.fromCurrency,
              from: IntegrationAccount.create(IntegrationType.PLATFORM, params.platformMember.accountId),
              toAmount: payout.toAmount,
              toIntegration: payout.toIntegration,
              toCurrency: payout.toCurrency,
              to: to.account,
            },
            exponentByCurrency: await this.currencyRepository.getExponents(ctx),
          },
          ctx,
        )

        return payout
      })
      .execute()
  }

  private async preparePayoutData(params: CreatePayoutIntentParams): Promise<{
    readonly to: DestinationIntegrationAccount
    readonly platformFeeAccount: SourceIntegrationAccount | null
    readonly convertIntegrationFee: ConversionRateResult
    readonly platformFee: PlatformFeeResult
    readonly userBalance: Balance
  }> {
    const integrationTransferFee = await this.externalIntegrationRepository.getEstimatedTransferFee(
      params.estimatedTransferFeeId,
    )

    if (!integrationTransferFee || integrationTransferFee.integration !== params.fromIntegration) {
      throw new EstimatedTransferFeeNotFoundException(params.estimatedTransferFeeId)
    }

    const platformFee = await this.feeRepository.getPlatformFee({
      integration: params.fromIntegration,
      currency: params.fromCurrency,
    })

    const convertResult = await this.rateRepository.getConversionRate({
      from: {
        amount: integrationTransferFee.amount,
        currency: integrationTransferFee.currency,
      },
      to: {
        currency: params.fromCurrency,
      },
    })

    const totalAmount = integrationTransferFee.amount.plus(convertResult.to.amount)

    const { userBalance } = await this.checkBalances({
      integration: params.fromIntegration,
      currency: params.fromCurrency,
      userPlatformAccountId: params.platformMember.accountId,
      amount: totalAmount,
    })

    const existedPayment = await this.integrationAccountLinkRepository.getActive({
      integration: params.fromIntegration,
      accounts: new Set([params.toAccount]),
    })
    const to = existedPayment.find((item) => item.integrationAccount.currency === params.fromCurrency) ?? null

    return {
      to: to
        ? {
            account: to.integrationAccount.account,
            platformAccountId: to.platformAccountId,
            accountLinkId: to.id,
          }
        : {
            account: params.toAccount,
          },
      platformFeeAccount: platformFee.platformFeeAccount
        ? {
            account: platformFee.platformFeeAccount.integrationAccount.account,
            platformAccountId: platformFee.platformFeeAccount.platformAccountId,
            accountLinkId: platformFee.platformFeeAccount.id,
          }
        : null,
      convertIntegrationFee: convertResult,
      platformFee,
      userBalance,
    }
  }

  private async checkBalances(params: {
    readonly integration: IntegrationType
    readonly currency: IntegrationCurrency
    readonly userPlatformAccountId: UUID
    readonly amount: Numeric
  }): Promise<Readonly<{ userBalance: Balance }>> {
    const { integration, currency, userPlatformAccountId, amount } = params
    const balanceCurrency = new Set([currency])

    const balanceResult = await this.ledgerRepository.getBalances({
      platform: [
        {
          accountId: userPlatformAccountId,
          integration,
          currencies: balanceCurrency,
        },
      ],
    })

    const userBalance = balanceResult.platform.get(userPlatformAccountId)?.get(integration)?.get(currency)

    const amountParams = {
      userBalance,
      totalAmount: amount,
    }

    PayoutBalancePolicy.validate(amountParams)

    return { userBalance: amountParams.userBalance }
  }
}
