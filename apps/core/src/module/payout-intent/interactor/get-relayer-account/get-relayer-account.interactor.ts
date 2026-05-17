import { AbstractInteractor, IntegrationAccount, IntegrationCurrency, RawNumeric, Numeric } from '@app/types'
import { Injectable } from '@nestjs/common'
import { CurrencyRepository } from '../../../../data/repository/currency/currency.repository'
import { RelayerRepository } from '../../../../data/repository/relayer/relayer.repository'
import { IntegrationType } from '@app/shared'

export interface GetRelayerAccountParams {
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
  readonly amount: RawNumeric
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
  ) {
    super()
  }

  async execute(params: GetRelayerAccountParams): Promise<IntegrationAccount> {
    const exponents = await this.currencyRepository.getExponents()
    const exponent = exponents.get(params.integration)?.get(params.currency)

    if (!exponent) {
      throw new Error(`Unknown currency exponent! ${params.integration}, ${params.currency}`)
    }

    const amount = Numeric.fromExponent(params.amount, exponent)

    const result = await this.relayerRepository.findAvailable({
      integration: params.integration,
      currency: params.currency,
      amount: amount,
    })

    if (!result) {
      throw new Error(`Relayer account not found for ${JSON.stringify(params)}`)
    }

    return result
  }
}
