import { Module } from '@nestjs/common'
import { TransferRouteCommandListenerModule } from './listener/transfer-route-command/transfer-route-command-listener.module'
import { TransferIntentHeldListenerModule } from './listener/transfer-intent-held/transfer-intent-held-listener.module'

// Executor: builds, signs and tracks transactions of transfer routes it is commanded to execute.
@Module({
  imports: [TransferRouteCommandListenerModule, TransferIntentHeldListenerModule],
})
export class TransactionModule {}
