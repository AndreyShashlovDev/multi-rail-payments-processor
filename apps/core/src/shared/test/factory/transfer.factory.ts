import { IntegrationAccount, IntegrationCurrency, Numeric, Id } from '@app/types'
import { TransferModel } from '../../model/transfer.model'

export class TransferFactory {
  static create(overrides?: Partial<TransferModel>): TransferModel {
    return {
      id: Id.create(Math.floor(Math.random() * 1000_000_00)),
      index: 1,
      from: 'TR7From' as IntegrationAccount,
      to: 'TR7To' as IntegrationAccount,
      amount: Numeric.create(100),
      currency: 'USDT' as IntegrationCurrency,
      intent: null,
      ...overrides,
    }
  }
}
