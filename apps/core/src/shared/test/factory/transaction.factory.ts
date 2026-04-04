import { IntegrationType, TransactionStatus } from '@app/shared'
import { Numeric, Id } from '@app/types'
import { TransactionModel } from '../../../module/transaction/model/transaction.model'
import { IntegrationCurrencyFactory } from './integration-currency.factory'

export class TransactionFactory {
  static create(overrides?: Partial<Omit<TransactionModel, 'transfers'>>): Omit<TransactionModel, 'transfers'> {
    const id = Id.create(Math.floor(Math.random() * 1000_000_00))

    return {
      id,
      sourceTxId: `0xtx_${id}`,
      integration: IntegrationType.ETHEREUM,
      status: TransactionStatus.CONFIRMED,
      fee: Numeric.create(5),
      feeCurrency: IntegrationCurrencyFactory.create(IntegrationType.ETHEREUM),
      executedAt: new Date(),
      ...overrides,
    }
  }
}
