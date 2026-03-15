import { EvmAddress } from '@app/types/blockchain.type'
import { IntegrationType } from '@app/shared'
import { UUID } from '@app/types/uuid.type'

const INTEGRATION_ACCOUNT_BRAND = Symbol('IntegrationAccount')

export type IntegrationAccount = (EvmAddress | UUID) & { readonly [INTEGRATION_ACCOUNT_BRAND]: true }

export const IntegrationAccount = {
  create(_integration: IntegrationType, account: EvmAddress | UUID): IntegrationAccount {
    // can validate account
    return account as IntegrationAccount
  },
}
