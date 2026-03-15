import { Module } from '@nestjs/common'
import { CurrencyConverterProviderModule } from './currency-converter-provider.module'
import { PlatformFeeProviderModule } from './platform-fee-provider.module'

@Module({
  imports: [CurrencyConverterProviderModule, PlatformFeeProviderModule],
})
export class SharedProviderModule {}
