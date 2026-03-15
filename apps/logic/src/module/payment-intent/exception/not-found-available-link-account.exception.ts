import { IntegrationType } from '@app/shared'
import { IntegrationCurrency } from '@app/types'

export class NotFoundAvailableLinkAccountException extends Error {
  constructor(integration: IntegrationType, currency: IntegrationCurrency) {
    super(`Not found available account for payment by integration ${integration}, currency: ${currency}`)
  }
}
