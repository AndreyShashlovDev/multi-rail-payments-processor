import { Module } from '@nestjs/common'
import { GetCurrencyRateConverterOperation } from './get-currency-rate-converter.operation'

@Module({
  providers: [GetCurrencyRateConverterOperation],
  exports: [GetCurrencyRateConverterOperation],
})
export class GetCurrencyRateConverterOperationModule {}
