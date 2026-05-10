import { Module } from '@nestjs/common'
import { ConverterCurrencyQueryHandler } from './converter-currency-query.handler'

@Module({
  providers: [ConverterCurrencyQueryHandler],
})
export class ConverterCurrencyQueryHandlerModule {}
