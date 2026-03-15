import { HasIntegrationAccountParams, HasIntegrationAccountResult } from './integration-account-repository.types'

export class IntegrationAccountRepository {
  async hasAccounts(data: HasIntegrationAccountParams): Promise<HasIntegrationAccountResult> {
    // grpc request to logic
    return { existing: data.addresses }
  }
}
