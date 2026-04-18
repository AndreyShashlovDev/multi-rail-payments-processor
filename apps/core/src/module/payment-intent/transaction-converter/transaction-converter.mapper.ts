import { ExactPaymentConverter } from './converter/converter/exact-payment.converter'
import { FeePaymentOperation } from './converter/operation/fee-payment.operation'
import { PaymentOperation } from './converter/operation/payment.operation'
import { OverpayPaymentConverter } from './converter/converter/overpay-payment.converter'
import { OverpayPaymentOperation } from './converter/operation/overpay-payment.operation'
import { UnderpayPaymentConverter } from './converter/converter/underpay-payment.converter'
import { UnderpayPaymentOperation } from './converter/operation/underpay-payment.operation'
import { MispayPaymentConverter } from './converter/converter/mispay-payment.converter'
import { MispayPaymentOperation } from './converter/operation/mispay-payment.operation'
import { HoldInPaymentOperation } from './converter/operation/hold-in-payment.operation'

export const PaymentConverters = [
  new ExactPaymentConverter(new FeePaymentOperation(), new PaymentOperation(), new HoldInPaymentOperation()),
  new UnderpayPaymentConverter(new FeePaymentOperation(), new UnderpayPaymentOperation(), new HoldInPaymentOperation()),
  new OverpayPaymentConverter(new FeePaymentOperation(), new OverpayPaymentOperation(), new HoldInPaymentOperation()),
  new MispayPaymentConverter(new MispayPaymentOperation(), new HoldInPaymentOperation()),
]
