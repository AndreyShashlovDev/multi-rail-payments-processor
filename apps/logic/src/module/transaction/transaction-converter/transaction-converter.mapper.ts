import { ExactPaymentConverter } from './payment-converter/converter/exact-payment.converter'
import { FeePaymentOperation } from './payment-converter/operation/fee-payment.operation'
import { PaymentOperation } from './payment-converter/operation/payment.operation'
import { OverpayPaymentConverter } from './payment-converter/converter/overpay-payment.converter'
import { OverpayPaymentOperation } from './payment-converter/operation/overpay-payment.operation'
import { UnderpayPaymentConverter } from './payment-converter/converter/underpay-payment.converter'
import { UnderpayPaymentOperation } from './payment-converter/operation/underpay-payment.operation'
import { MispayPaymentConverter } from './payment-converter/converter/mispay-payment.converter'
import { MispayPaymentOperation } from './payment-converter/operation/mispay-payment.operation'
import { SequentialExactPaymentConverter } from './payment-converter/converter/sequential-exact-payment.converter'
import { SingleIntegrationPayoutConverter } from './payout-converter/converter/single-integration-payout.converter'
import {
  SingleIntegrationAmountPayoutOperation,
} from './payout-converter/operation/single-integration-amount-payout.operation'
import { PlatformFeePayoutOperation } from './payout-converter/operation/platform-fee-payout.operation'
import { IntegrationFeePayoutOperation } from './payout-converter/operation/integration-fee-payout.operation'
import { HoldInPaymentOperation } from './payment-converter/operation/hold-in-payment.operation'
import {
  SingleIntegrationPayoutHoldConverter,
} from './payout-converter/converter/single-integration-payout-hold.converter'
import { PayoutHoldsOperation } from './payout-converter/operation/payout-holds.operation'

export const PaymentConverters = [
  new ExactPaymentConverter(new FeePaymentOperation(), new PaymentOperation(), new HoldInPaymentOperation()),
  new SequentialExactPaymentConverter(new FeePaymentOperation(), new PaymentOperation(), new HoldInPaymentOperation()),
  new OverpayPaymentConverter(
    new FeePaymentOperation(),
    new PaymentOperation(),
    new OverpayPaymentOperation(),
    new HoldInPaymentOperation(),
  ),
  new UnderpayPaymentConverter(new UnderpayPaymentOperation(), new HoldInPaymentOperation()),
  new MispayPaymentConverter(new MispayPaymentOperation(), new HoldInPaymentOperation()),
]

export const PayoutConfirmedConverters = [
  new SingleIntegrationPayoutConverter(
    new SingleIntegrationAmountPayoutOperation(),
    new PlatformFeePayoutOperation(),
    new IntegrationFeePayoutOperation(),
  ),
]

export const PayoutPreparedConverters = [new SingleIntegrationPayoutHoldConverter(new PayoutHoldsOperation())]