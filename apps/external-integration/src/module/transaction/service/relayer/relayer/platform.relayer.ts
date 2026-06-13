import { Relayer, RelayerGetAccountParams } from '../relayer'
import { IntegrationAccount } from '@app/types'
import { RelayerRepository } from '../../../../../data/repository/relayer/relayer.repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PlatformRelayer implements Relayer {
  constructor(private readonly relayerRepository: RelayerRepository) {}

  async getAccount(params: RelayerGetAccountParams): Promise<IntegrationAccount> {
    return await this.relayerRepository.getRelayerAccount({
      ...params,
      fromAccount: params.from,
      toAccount: params.to,
    })
  }

  isSupported(_params: RelayerGetAccountParams): boolean {
    return true
  }
}
