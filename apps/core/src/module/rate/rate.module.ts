import { Module } from '@nestjs/common'
import { ConverterCurrencyQueryHandlerModule } from './handler/converter-currency-query-handler.module'

@Module({
  imports: [ConverterCurrencyQueryHandlerModule],
})
export class RateModule {}
