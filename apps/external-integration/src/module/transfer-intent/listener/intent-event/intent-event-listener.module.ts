import { Module } from '@nestjs/common'
import { IntentEventListener } from './intent-event.listener'
import { TransferIntentCreateInteractorModule } from '../../interactor/create-transfer-intent/transfer-intent-create-interactor.module'
import { ProcessHeldTransferIntentInteractorModule } from '../../interactor/process-held-transfer-intent/process-held-transfer-intent-interactor.module'
import { TransferIntentConsumerModule } from '../../../../data/consumer/transfer-intent/transfer-intent-consumer.module'

@Module({
  imports: [
    TransferIntentConsumerModule,
    TransferIntentCreateInteractorModule,
    ProcessHeldTransferIntentInteractorModule,
  ],
  providers: [IntentEventListener],
})
export class IntentEventListenerModule {}
