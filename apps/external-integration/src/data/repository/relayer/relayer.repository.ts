import { CoreGrpcClient } from '../../data-source/grpc/core/core-grpc-client'
import { GetRelayerAccountParams } from './relayer-repository.types'
import { IntegrationAccount } from '@app/types'
import { Injectable } from '@nestjs/common'

@Injectable()
export class RelayerRepository {
  constructor(private readonly coreGrpcClient: CoreGrpcClient) {}

  async getRelayerAccount(params: GetRelayerAccountParams): Promise<IntegrationAccount> {
    const response = await this.coreGrpcClient.getRelayerAccount(params)

    return response.relayerAccount as IntegrationAccount
  }
}
