import { Module } from '@nestjs/common'
import { PayoutController } from './payout.controller'

@Module({
  imports: [],
  controllers: [PayoutController],
})
export class PayoutControllerModule {}
