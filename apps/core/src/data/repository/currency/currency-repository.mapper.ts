import { IntegrationCurrencyEntity } from '../../data-source/postgres/entities/integration-currency.entity'
import { IntegrationCurrencyModel } from '../../../shared/model/integration-currency.model'
import { integrationTypeToDomain } from '@app/shared'

export class CurrencyRepositoryMapper {
  static toDomain(entity: IntegrationCurrencyEntity): IntegrationCurrencyModel {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      symbol: entity.symbol,
      integration: integrationTypeToDomain(entity.integration),
      currency: entity.currency,
      displayDecimals: entity.displayDecimals,
      minorUnit: entity.minorUnit,
    }
  }
}
