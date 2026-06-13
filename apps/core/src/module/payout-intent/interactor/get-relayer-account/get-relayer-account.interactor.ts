import { AbstractInteractor, IntegrationAccount, IntegrationCurrency, RawNumeric, Numeric } from '@app/types'
import { Injectable } from '@nestjs/common'
import { CurrencyRepository } from '../../../../data/repository/currency/currency.repository'
import { RelayerRepository } from '../../../../data/repository/relayer/relayer.repository'
import { IntegrationType } from '@app/shared'
import { IntegrationAccountRepository } from '../../../../data/repository/integration-account/integration-account.repository'

export interface GetRelayerAccountParams {
  readonly fromIntegration: IntegrationType
  readonly fromAccount: IntegrationAccount
  readonly fromCurrency: IntegrationCurrency
  readonly fromAmount: RawNumeric
  readonly toIntegration: IntegrationType
  readonly toAccount: IntegrationAccount
  readonly toCurrency: IntegrationCurrency
  readonly toAmount: RawNumeric
  // todo info for integration fee. feeCurrency, feeAmount
}

@Injectable()
export class GetRelayerAccountInteractor extends AbstractInteractor<
  GetRelayerAccountParams,
  Promise<IntegrationAccount>
> {
  constructor(
    private readonly currencyRepository: CurrencyRepository,
    private readonly relayerRepository: RelayerRepository,
    private readonly integrationAccountRepository: IntegrationAccountRepository,
  ) {
    super()
  }

  async execute(params: GetRelayerAccountParams): Promise<IntegrationAccount> {
    const exponents = await this.currencyRepository.getExponents()
    const exponent = exponents.get(params.toIntegration)?.get(params.toCurrency)

    if (!exponent) {
      throw new Error(`Unknown currency exponent! ${params.toIntegration}, ${params.toCurrency}`)
    }

    const amount = Numeric.fromExponent(params.toAmount, exponent)

    const isCrossRelayer = params.fromIntegration != params.toIntegration || params.fromCurrency !== params.toCurrency
    const existedPlatformAccounts = await this.integrationAccountRepository.hasAccounts({
      accounts: new Set([params.toAccount]),
    })
    const isToPlatformAccount = existedPlatformAccounts.existing.has(params.toAccount)

    let account: IntegrationAccount | null

    if (isCrossRelayer) {
      const result = await this.relayerRepository.findPlatformAvailable({
        integration: params.toIntegration,
        currency: params.toCurrency,
        amount: amount,
      })

      account = result
        ? isToPlatformAccount
          ? IntegrationAccount.create(params.toIntegration, result.platformAccountId) // fixme
          : result.account
        : null
    } else {
      account = await this.relayerRepository.findSystemAvailable({
        integration: params.toIntegration,
        currency: params.toCurrency,
        amount: amount,
      })
    }

    if (!account) {
      // todo named error
      throw new Error(`Relayer account not found for ${JSON.stringify(params)}`)
    }

    return account
  }
}
