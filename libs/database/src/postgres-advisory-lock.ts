import { UUID, IntegrationCurrency } from '@app/types'
import { createHash } from 'node:crypto'
import { IntegrationType } from '@app/shared'

export class PostgresAdvisoryLock {
  static readonly CORE_PAYMENT_INBOX = new PostgresAdvisoryLock('payment:inbox')
  static readonly CORE_PAYOUT_INBOX = new PostgresAdvisoryLock('payout:inbox')

  static readonly CORE_PAYOUT_INTENT_BALANCE = (
    accountId: UUID,
    integration: IntegrationType,
    currency: IntegrationCurrency,
  ): PostgresAdvisoryLock => new PostgresAdvisoryLock(`payout_intent_balance:${accountId}:${integration}:${currency}`)

  readonly key: bigint

  private constructor(readonly name: string) {
    const hash = createHash('sha256').update(name).digest('hex').slice(0, 15)
    this.key = BigInt(`0x${hash}`)
  }
}
