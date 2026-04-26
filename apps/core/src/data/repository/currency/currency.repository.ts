import { Injectable } from '@nestjs/common'
import { IntegrationCurrencyModel, IntegrationCurrencyData } from '../../../shared/model/integration-currency.model'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'
import { TxContext } from '@app/shared/types/tx-context.type'
import { IntegrationCurrencyEntity } from '../../data-source/postgres/entities/integration-currency.entity'
import { CurrencyRepositoryMapper } from './currency-repository.mapper'
import { integrationTypeFromDomain, integrationTypeToDomain, IntegrationType } from '@app/shared'
import { ExponentCurrencyResult } from './currency-repository.types'
import { IntegrationCurrency } from '@app/types'

@Injectable()
export class CurrencyRepository {
  private exponentByCurrency: ExponentCurrencyResult = new Map()

  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async getExponents(ctx?: TxContext): Promise<ExponentCurrencyResult> {
    if (this.exponentByCurrency.size === 0) {
      const result = await (ctx?.em ?? this.datasource.manager).find(IntegrationCurrencyEntity)

      this.exponentByCurrency = result.reduce((acc, curr) => {
        const integration = integrationTypeToDomain(curr.integration)
        const map = acc.get(integration) ?? new Map<IntegrationCurrency, number>()
        map.set(curr.currency, curr.minorUnit)
        return acc.set(integration, map)
      }, new Map<IntegrationType, Map<IntegrationCurrency, number>>())
    }

    return this.exponentByCurrency
  }

  // todo cache
  async findByIntegration(
    params: Pick<IntegrationCurrencyData, 'integration'>,
    ctx?: TxContext,
  ): Promise<ReadonlyArray<IntegrationCurrencyModel>> {
    const result = await (ctx?.em ?? this.datasource.manager).find(IntegrationCurrencyEntity, {
      where: { integration: integrationTypeFromDomain(params.integration) },
    })

    return result.map((currency) => CurrencyRepositoryMapper.toDomain(currency))
  }
}
