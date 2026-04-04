import { IntegrationCurrency } from '@app/types'
import { randomBytes } from 'node:crypto'
import { IntegrationType } from '@app/shared'

export class IntegrationCurrencyFactory {
  static create(integration: IntegrationType = IntegrationType.ETHEREUM): IntegrationCurrency {
    if (integration !== IntegrationType.ETHEREUM) {
      throw new Error('cannot support integration for create currency')
    }

    return IntegrationCurrency.create(`0x${randomBytes(20).toString('hex')}`)
  }
}
