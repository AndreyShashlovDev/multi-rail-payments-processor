import { Relayer, RelayerGetAccountParams } from '../relayer'
import { IntegrationAccount } from '@app/types'
import { RelayerRepository } from '../../../../data/repository/relayer/relayer.repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PlatformRelayer implements Relayer {
  constructor(private readonly relayerRepository: RelayerRepository) {}

  async getAccount(params: RelayerGetAccountParams): Promise<IntegrationAccount> {
    return await this.relayerRepository.getRelayerAccount({
      integration: params.toIntegration,
      currency: params.toCurrency,
      amount: params.toAmount,
      integrationFee: '0',
    })
  }

  isSupported(_params: RelayerGetAccountParams): boolean {
    return true
  }
}
