import { IntegrationAccountResult } from './custody-repository.types'
import { ReplaySubject, Subscription } from 'rxjs'

/**
 * Mocked repository for Custody external service (create/sign/account for wallet (account) of some integrations)
 */
export class CustodyRepository {
  private readonly accountsSubject = new ReplaySubject<IntegrationAccountResult>(Infinity)

  onAccountsCreatedObservable(handler: (data: IntegrationAccountResult) => Promise<void>): Subscription {
    return this.accountsSubject.subscribe({
      next: (value) => {
        handler(value).catch((e) => console.error(e))
      },
    })
  }
}
