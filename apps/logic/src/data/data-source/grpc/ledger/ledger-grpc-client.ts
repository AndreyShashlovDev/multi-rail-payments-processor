import { Injectable, Inject } from '@nestjs/common'
import { LedgerClient, LEDGER_SERVICE_NAME } from '@app/shared/services/ledger/v1/grpc/generated/ledger'
import { GetBalancesRequest, GetBalancesResponse } from '@app/shared/services/ledger/v1/grpc/generated/balance'
import { type ClientGrpc } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class LedgerGrpcClient {
  private ledgerService!: LedgerClient

  constructor(@Inject('LEDGER_PACKAGE') client: ClientGrpc) {
    this.ledgerService = client.getService<LedgerClient>(LEDGER_SERVICE_NAME)
  }

  async getBalances(request: GetBalancesRequest): Promise<GetBalancesResponse> {
    return firstValueFrom(this.ledgerService.getBalance(request))
  }
}
