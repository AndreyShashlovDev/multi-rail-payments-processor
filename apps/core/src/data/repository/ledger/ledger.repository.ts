import { LedgerGrpcClient } from '../../data-source/grpc/ledger/ledger-grpc-client'
import { LedgerRepositoryMapper } from './ledger-repository.mapper'
import { GetBalancesResult } from './ledger-repository.types'
import { Injectable } from '@nestjs/common'
import { GetBalancesParams } from '@app/shared'

@Injectable()
export class LedgerRepository {
  constructor(private readonly grpcClient: LedgerGrpcClient) {}

  async getBalances(params: GetBalancesParams): Promise<GetBalancesResult> {
    const request = LedgerRepositoryMapper.getBalancesFromDomain(params)
    const response = await this.grpcClient.getBalances(request)

    return LedgerRepositoryMapper.getBalancesToDomain(response)
  }
}
