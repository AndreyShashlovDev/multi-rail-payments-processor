import { Global, Module, ClassProvider } from '@nestjs/common'
import { CurrencyConverterProvider } from '../../shared/currency/currency-converter.provider'
import { ConverterCurrencyOperation } from '../../module/currency/operation/converter-currency.operation'

const Provider: ClassProvider = {
  provide: CurrencyConverterProvider,
  useClass: ConverterCurrencyOperation,
}

@Global()
@Module({
  providers: [Provider],
  exports: [Provider],
})
export class CurrencyConverterProviderModule {}
