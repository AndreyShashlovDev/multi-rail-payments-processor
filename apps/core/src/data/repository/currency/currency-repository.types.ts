import { IntegrationType } from '@app/shared'
import { IntegrationCurrency } from '@app/types'

export type ExponentCurrencyResult = ReadonlyMap<IntegrationType, ReadonlyMap<IntegrationCurrency, number>>
