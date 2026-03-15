import { Numeric, UUID, IntegrationCurrency, IntegrationAccount } from '@app/types'
import { BalanceChange } from '@app/shared/types/balance-change'
import { IntegrationType, BalanceChangeType } from '@app/shared'

// ---------------------------------------------------------------------------
// Balance projection for a single entity (user or wallet)
// ---------------------------------------------------------------------------

/**
 * balance   — total known funds (confirmed + pending incoming)
 * available — funds ready to spend (balance - holds - holdIn)
 * holds     — frozen outgoing funds (HOLD / RELEASE_HOLD)
 * holdIn    — pending incoming funds not yet confirmed (HOLD_IN / RELEASE_HOLD_IN)
 *
 * Invariant:  available = balance - holds - holdIn
 */
export interface LedgerBalance {
  readonly balance: Numeric
  readonly available: Numeric
  readonly holds: Numeric
  readonly holdIn: Numeric
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export interface BalanceQuery {
  readonly platformAccountId?: UUID | null
  readonly integrationAccount?: IntegrationAccount | null
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
}

// ---------------------------------------------------------------------------
// LedgerRepositoryMock
// ---------------------------------------------------------------------------

export class LedgerRepositoryMock {
  private balances = new Map<string, LedgerBalance>()

  // ── key builders ──────────────────────────────────────────────────────────

  private walletKey(integration: IntegrationType, account: IntegrationAccount, currency: IntegrationCurrency): string {
    return `wallet:${integration}|${account}|${currency}`
  }

  private userKey(platformAccountId: UUID, integration: IntegrationType, currency: IntegrationCurrency): string {
    return `user:${platformAccountId}|${integration}|${currency}`
  }

  // ── public API ────────────────────────────────────────────────────────────

  publish(changes: ReadonlyArray<BalanceChange>): void {
    for (const change of changes) {
      this.applyChange(change)
    }
  }

  getBalance(queries: BalanceQuery[]): Map<string, LedgerBalance> {
    const result = new Map<string, LedgerBalance>()
    const zero = (): LedgerBalance => ({
      balance: Numeric.ZERO,
      available: Numeric.ZERO,
      holds: Numeric.ZERO,
      holdIn: Numeric.ZERO,
    })

    for (const query of queries) {
      if (query.integrationAccount) {
        const key = this.walletKey(query.integration, query.integrationAccount, query.currency)
        result.set(key, this.balances.get(key) ?? zero())
      }
      if (query.platformAccountId) {
        const key = this.userKey(query.platformAccountId, query.integration, query.currency)
        result.set(key, this.balances.get(key) ?? zero())
      }
    }

    return result
  }

  reset(): void {
    this.balances.clear()
  }

  getAllBalances(): Map<string, LedgerBalance> {
    return new Map(this.balances)
  }

  // ── private ───────────────────────────────────────────────────────────────

  private getOrInit(key: string): LedgerBalance {
    if (!this.balances.has(key)) {
      this.balances.set(key, {
        balance: Numeric.ZERO,
        available: Numeric.ZERO,
        holds: Numeric.ZERO,
        holdIn: Numeric.ZERO,
      })
    }
    return this.balances.get(key)!
  }

  private applyChange(change: BalanceChange): void {
    if (change.integrationAccount) {
      this.applyToKey(this.walletKey(change.integration, change.integrationAccount, change.currency), change)
    }
    if (change.platformAccountId) {
      this.applyToKey(this.userKey(change.platformAccountId, change.integration, change.currency), change)
    }
  }

  private applyToKey(key: string, change: BalanceChange): void {
    const b = this.getOrInit(key)

    switch (change.type) {
      case BalanceChangeType.CREDIT:
        this.balances.set(key, {
          ...b,
          balance: b.balance.plus(change.amount),
          available: b.available.plus(change.amount),
        })
        break

      case BalanceChangeType.DEBIT:
        this.balances.set(key, {
          ...b,
          balance: b.balance.minus(change.amount),
          available: b.available.minus(change.amount),
        })
        break

      case BalanceChangeType.PLATFORM_FEE_ACCRUED:
        this.balances.set(key, {
          ...b,
          available: b.available.minus(change.amount),
          holds: b.holds.plus(change.amount),
        })
        break

      case BalanceChangeType.HOLD:
        this.balances.set(key, {
          ...b,
          available: b.available.minus(change.amount),
          holds: b.holds.plus(change.amount),
        })
        break

      case BalanceChangeType.RELEASE_HOLD:
        this.balances.set(key, {
          ...b,
          available: b.available.plus(change.amount),
          holds: b.holds.minus(change.amount),
        })
        break

      // Pending incoming: funds visible in total balance but not spendable yet
      case BalanceChangeType.HOLD_IN:
        this.balances.set(key, { ...b, balance: b.balance.plus(change.amount), holdIn: b.holdIn.plus(change.amount) })
        break

      // Confirmation: remove from holdIn — CREDIT event will follow to add to available
      case BalanceChangeType.RELEASE_HOLD_IN:
        this.balances.set(key, {
          ...b,
          balance: b.balance.minus(change.amount),
          holdIn: Numeric.max(Numeric.ZERO, b.holdIn.minus(change.amount)),
        })
        break

      default:
        throw new Error(`Unknown balance change type: ${(change as unknown as BalanceChange).type}`)
    }
  }
}
