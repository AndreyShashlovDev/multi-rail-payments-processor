import { IntegrationAccountLinkFactory } from './integration-account-link.factory'
import { IntegrationType } from '@app/shared'
import {
  PaymentIntentModel,
  PaymentIntentStatus,
  PaymentOperationType,
} from '../../../module/payment-intent/model/payment-intent.model'
import { randomUUID } from 'node:crypto'
import { Numeric } from '@app/types'
import { IntegrationCurrencyFactory } from './integration-currency.factory'

const currency = IntegrationCurrencyFactory.create(IntegrationType.ETHEREUM)

export class PaymentIntentFactory {
  static create(overrides?: Partial<PaymentIntentModel>): PaymentIntentModel {
    const to = IntegrationAccountLinkFactory.create()

    return {
      id: randomUUID(),
      operationType: overrides?.operationType ?? PaymentOperationType.USER_REQUEST,
      member: {
        accountId: to.platformAccountId,
        userId: randomUUID(),
      },
      amount: Numeric.create(100),
      paid: Numeric.ZERO,
      currency: currency,
      integration: IntegrationType.ETHEREUM,
      status: PaymentIntentStatus.CREATED,
      to: {
        account: to.integrationAccount.account,
        platformAccountId: to.platformAccountId,
        accountLinkId: to.id,
      },
      fromPlatformAccountId: null,
      fromIntegrationAccount: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      platformFee: null,
      platformFeeAccount: null,
      platformFeePayer: null,
      ...overrides,
    }
  }
}
