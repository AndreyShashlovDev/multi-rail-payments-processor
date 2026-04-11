import { SingleIntegrationPayoutConverter } from './payout-converter/converter/single-integration-payout.converter'
import {
  SingleIntegrationAmountPayoutOperation,
} from './payout-converter/operation/single-integration-amount-payout.operation'
import { PlatformFeePayoutOperation } from './payout-converter/operation/platform-fee-payout.operation'
import { IntegrationFeePayoutOperation } from './payout-converter/operation/integration-fee-payout.operation'
import {
  SingleIntegrationPayoutHoldConverter,
} from './payout-converter/converter/single-integration-payout-hold.converter'
import { PayoutHoldsOperation } from './payout-converter/operation/payout-holds.operation'

export const PayoutConfirmedConverters = [
  new SingleIntegrationPayoutConverter(
    new SingleIntegrationAmountPayoutOperation(),
    new PlatformFeePayoutOperation(),
    new IntegrationFeePayoutOperation(),
  ),
]

export const PayoutPreparedConverters = [new SingleIntegrationPayoutHoldConverter(new PayoutHoldsOperation())]
