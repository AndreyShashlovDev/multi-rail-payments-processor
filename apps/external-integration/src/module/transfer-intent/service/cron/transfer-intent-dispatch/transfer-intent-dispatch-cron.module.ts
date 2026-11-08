import { Module } from '@nestjs/common'
import { TransferIntentDispatchCron } from './transfer-intent-dispatch.cron'
import { DispatchTransferIntentInteractorModule } from '../../../interactor/dispatch-transfer-intent/dispatch-transfer-intent-interactor.module'

@Module({
  imports: [DispatchTransferIntentInteractorModule],
  providers: [TransferIntentDispatchCron],
})
export class TransferIntentDispatchCronModule {}
