import { Relayer, RelayerGetAccountParams } from './relayer'
import { IntegrationAccount } from '@app/types'

export class RelayerStrategy implements Relayer {
  constructor(private readonly relayers: Set<Relayer>) {}

  getAccount(params: RelayerGetAccountParams): Promise<IntegrationAccount> {
    const relayer = this.getRelayer(params)

    if (!relayer) {
      throw new Error(`Relayer not support ${JSON.stringify(params)}`)
    }

    return relayer.getAccount(params)
  }

  isSupported(params: RelayerGetAccountParams): boolean {
    return this.getRelayer(params) !== null
  }

  private getRelayer(params: RelayerGetAccountParams): Relayer | null {
    return Array.from(this.relayers).find((relayer) => relayer.isSupported(params)) ?? null
  }
}
