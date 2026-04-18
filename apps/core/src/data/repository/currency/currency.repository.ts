import { Injectable } from '@nestjs/common'
import { IntegrationCurrencyModel, IntegrationCurrencyData } from '../../../shared/model/integration-currency.model'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'
import { TxContext } from '@app/shared/types/tx-context.type'
import { IntegrationCurrencyEntity } from '../../data-source/postgres/entities/integration-currency.entity'
import { CurrencyRepositoryMapper } from './currency-repository.mapper'
import { integrationTypeFromDomain } from '@app/shared'

@Injectable()
export class CurrencyRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

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
