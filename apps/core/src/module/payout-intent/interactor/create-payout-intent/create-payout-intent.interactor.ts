import { AbstractInteractor, UUID, IntegrationCurrency, Numeric, IntegrationAccount } from '@app/types'
import { PayoutIntentModel } from '../../model/payout-intent.model'
import { PayoutIntentRepository } from '../../../../data/repository/payout-intent/payout-intent.repository'
import {
  ExternalIntegrationRepository,
} from '../../../../data/repository/external-integration/external-integration.repository'
import { LedgerRepository } from '../../../../data/repository/ledger/ledger.repository'
import { Injectable } from '@nestjs/common'
import { IntegrationType, IntentType } from '@app/shared'
import { PlatformFeeProvider, PlatformFeeProviderResult } from '../../../../shared/platform-fee/platform-fee.provider'
import {
  CurrencyConverterProvider,
  CurrencyConverterResult,
} from '../../../../shared/currency/currency-converter.provider'
import {
  IntegrationAccountLinkRepository,
} from '../../../../data/repository/integration-account-link/integration-account-link.repository'
import { PayoutAccountNotFoundException } from '../../exception/payout-account-not-found.exception'
import { IntegrationAccountLinkModel } from '../../../../shared/model/integration-account-link.model'
import { EstimatedTransferFeeNotFoundException } from '../../exception/estimated-transfer-fee-not-found.exception'
import { PayoutBalancePolicy } from '../../policy/payout-balance.policy'
import { PlatformMemberModel } from '../../../../shared/model/platform-member.model'
import {
  DestinationIntegrationAccount,
  SourceIntegrationAccount,
} from '../../../../shared/model/composite-integration-account.model'

export interface CreatePayoutIntentParams {
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
    private readonly payoutIntentRepository: PayoutIntentRepository,
    private readonly externalIntegrationRepository: ExternalIntegrationRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly platformFeeProvider: PlatformFeeProvider,
    private readonly currencyConverterProvider: CurrencyConverterProvider,
    private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository,
  ) {
    super()
  }

  async execute(params: CreatePayoutIntentParams): Promise<PayoutIntentModel> {
    const { from, to, platformFeeAccount, convertIntegrationFee, platformFee } = await this.preparePayoutData(params)

    // todo call some policy for validate payout configuration!
    const payout = await this.payoutIntentRepository.create({
      member: params.platformMember,
      from, // get platfromAccount (hot account)
      fromAmount: params.amount,
      fromCurrency: params.fromCurrency,
      fromIntegration: params.fromIntegration,
      estimatedFee: convertIntegrationFee.to.amount,
      estimatedFeeCurrency: convertIntegrationFee.from.currency,
      platformFee: platformFee.platformFee,
      platformFeeAccount,
      integrationFeeRate: convertIntegrationFee.to.rate,
      to, // looking for active payment or null
      toAmount: params.amount,
      toCurrency: params.fromCurrency,
      toIntegration: params.fromIntegration,
      exchangeRate: Numeric.create(1), // same currency and same integration
      integrationFeePayer: null,
      integrationFee: null,
      integrationFeeCurrency: convertIntegrationFee.from.currency,
    })

    await this.externalIntegrationRepository.createTransactionIntent({
      intentId: payout.id,
      intentType: IntentType.PAYOUT,
      estimatedFee: convertIntegrationFee.from.amount,
      feeCurrency: convertIntegrationFee.from.currency,
      fromAmount: payout.fromAmount,
      fromIntegration: payout.fromIntegration,
      fromCurrency: payout.fromCurrency,
      from: from.account,
      toAmount: payout.toAmount,
      toIntegration: payout.toIntegration,
      toCurrency: payout.toCurrency,
      to: to.account,
    })

    return payout
  }

  private async preparePayoutData(params: CreatePayoutIntentParams): Promise<{
    readonly from: SourceIntegrationAccount
    readonly to: DestinationIntegrationAccount
    readonly platformFeeAccount: SourceIntegrationAccount | null
    readonly convertIntegrationFee: CurrencyConverterResult
    readonly platformFee: PlatformFeeProviderResult
  }> {
    const integrationTransferFee = await this.externalIntegrationRepository.getEstimatedTransferFee(
      params.estimatedTransferFeeId,
    )

    if (!integrationTransferFee || integrationTransferFee.integration !== params.fromIntegration) {
      throw new EstimatedTransferFeeNotFoundException(params.estimatedTransferFeeId)
    }

    const platformFee = await this.platformFeeProvider.execute({
      integration: params.fromIntegration,
      currency: params.fromCurrency,
    })

    const convertResult = await this.currencyConverterProvider.execute({
      from: {
        amount: integrationTransferFee.amount,
        currency: integrationTransferFee.currency,
      },
      to: {
        currency: params.fromCurrency,
      },
    })

    const hotAccount = await this.integrationAccountLinkRepository.getPlatformHotAccount({
      integration: params.fromIntegration,
      currency: params.fromCurrency,
    })

    if (!hotAccount) {
      throw new PayoutAccountNotFoundException()
    }

    const totalAmount = integrationTransferFee.amount.plus(convertResult.to.amount)

    await this.checkBalances({
      integration: params.fromIntegration,
      currency: params.fromCurrency,
      userPlatformAccountId: params.platformMember.accountId,
      fromLink: hotAccount,
      amount: totalAmount,
    })

    const existedPayment = await this.integrationAccountLinkRepository.getActive({
      integration: params.fromIntegration,
      accounts: new Set([params.toAccount]),
    })
    const to =
      existedPayment.find((item) => item.integrationAccount.currency === params.fromCurrency) ??
      existedPayment[0] ??
      null

    return {
      from: {
        account: hotAccount.integrationAccount.account,
        platformAccountId: hotAccount.platformAccountId,
        accountLinkId: hotAccount.id,
      },
      to: {
        account: to?.integrationAccount.account ?? params.toAccount,
        platformAccountId: to?.platformAccountId,
        accountLinkId: to?.id,
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
    }
  }

  private async checkBalances(params: {
    readonly integration: IntegrationType
    readonly currency: IntegrationCurrency
    readonly userPlatformAccountId: UUID
    readonly fromLink: IntegrationAccountLinkModel
    readonly amount: Numeric
  }): Promise<void> {
    const { integration, currency, userPlatformAccountId, fromLink, amount } = params
    const balanceCurrency = new Set([currency])

    const balanceResult = await this.ledgerRepository.getBalances({
      platform: [
        {
          accountId: userPlatformAccountId,
          integration,
          currencies: balanceCurrency,
        },
      ],
      integration: [
        {
          account: fromLink.integrationAccount.account,
          integration,
          currencies: balanceCurrency,
        },
      ],
    })

    const userBalance = balanceResult.platform.get(userPlatformAccountId)?.get(integration)?.get(currency)

    const hotIntegrationAccountBalance = balanceResult.integration
      .get(fromLink.integrationAccount.account)
      ?.get(integration)
      ?.get(currency)

    PayoutBalancePolicy.validate(userBalance, hotIntegrationAccountBalance, amount)
  }
}
