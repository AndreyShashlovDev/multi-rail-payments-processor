export class PostgresAdvisoryLock {
  static readonly CORE_PAYMENT_INBOX = new PostgresAdvisoryLock('payment:inbox')
  static readonly CORE_PAYOUT_INBOX = new PostgresAdvisoryLock('payout:inbox')

  private constructor(readonly name: string) {}
}
