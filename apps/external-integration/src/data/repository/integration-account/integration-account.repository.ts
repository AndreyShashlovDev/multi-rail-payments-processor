import { HasIntegrationAccountParams, HasIntegrationAccountResult } from './integration-account-repository.types'
import { CoreGrpcClient } from '../../data-source/grpc/core/core-grpc-client'
import { IntegrationAccount } from '@app/types'
import { Injectable } from '@nestjs/common'

@Injectable()
export class IntegrationAccountRepository {
  constructor(private readonly coreGrpcClient: CoreGrpcClient) {}

  // todo use redis as cache?
  async hasAccounts(data: HasIntegrationAccountParams): Promise<HasIntegrationAccountResult> {
    const response = await this.coreGrpcClient.hasIntegrationAccount({
      account: Array.from(data.accounts),
    })

    return { existing: new Set(response.existing as IntegrationAccount[]) }
  }
}
