import { Module } from '@nestjs/common'
import { PlatformFeeQueryHandlerModule } from './handler/platform-fee-query-handler.module'

@Module({
  imports: [PlatformFeeQueryHandlerModule],
})
export class FeeModule {}
