import { IntegrationAccount } from '@app/types/integration-account'
import { EvmAddress } from '@app/types/blockchain.type'

export const NATIVE_INTERNAL_ACCOUNT = 'native' as const
export const isNativeCurrency = (account: IntegrationCurrency): account is IntegrationCurrency =>
  account === NATIVE_INTERNAL_ACCOUNT

export type IntegrationCurrency = IntegrationAccount | 'native' // token address or native

export const IntegrationCurrency = {
  create(value: 'native' | EvmAddress) {
    return value as IntegrationCurrency
  },
}
