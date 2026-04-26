import { UUID, IntegrationCurrency } from '@app/types'
import { createHash } from 'node:crypto'
import { IntegrationType } from '@app/shared'

type Services = 'integrations' | 'core' | 'ledger'

export class PostgresAdvisoryLock {
  static readonly INTEGRATIONS_OUTBOX = new PostgresAdvisoryLock('integrations', 'transaction-event', 'outbox')
  static readonly LEDGER_OUTBOX = new PostgresAdvisoryLock('ledger', 'balance-change-event', 'outbox')
  static readonly CORE_PAYMENT_INBOX = new PostgresAdvisoryLock('core', 'payment', 'inbox')
  static readonly CORE_PAYOUT_INBOX = new PostgresAdvisoryLock('core', 'payout', 'inbox')

  static readonly CORE_PAYOUT_INTENT_BALANCE = (
    accountId: UUID,
    integration: IntegrationType,
    currency: IntegrationCurrency,
  ): PostgresAdvisoryLock =>
    new PostgresAdvisoryLock('core', 'payout_intent_balance', `${accountId}:${integration}:${currency}`)

  readonly key: bigint
  readonly name: string

  private constructor(
    readonly service: Services,
    readonly domain: string,
    readonly tableOrKey: string,
  ) {
    this.name = `${service}:${domain}:${tableOrKey}`

    const hash = createHash('sha256').update(this.name).digest('hex').slice(0, 15)
    this.key = BigInt(`0x${hash}`)
  }
}
