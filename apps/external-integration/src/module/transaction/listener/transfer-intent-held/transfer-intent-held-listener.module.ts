import { Module } from '@nestjs/common'
import { TransferIntentHeldListener } from './transfer-intent-held.listener'
import { TransferIntentConsumerModule } from '../../../../data/consumer/transfer-intent/transfer-intent-consumer.module'
import { ProcessHeldTransactionInteractorModule } from '../../interactor/process-held-transaction/process-held-transaction-interactor.module'

@Module({
  imports: [TransferIntentConsumerModule, ProcessHeldTransactionInteractorModule],
  providers: [TransferIntentHeldListener],
})
export class TransferIntentHeldListenerModule {}
