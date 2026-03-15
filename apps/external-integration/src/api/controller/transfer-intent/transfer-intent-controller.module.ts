import { Module } from '@nestjs/common'
import { TransferIntentController } from './transfer-intent.controller'
import {
  TransferIntentRepositoryModule,
} from '../../../data/repository/transfer-intent/transfer-intent-repository.module'
import {
  TransferIntentCreateInteractorModule,
} from '../../../module/transfer-intent/interactor/create-transfer-intent/transfer-intent-create-interactor.module'
import {
  ProcessHeldTransferIntentInteractorModule,
} from '../../../module/transfer-intent/interactor/process-held-transfer-intent/process-held-transfer-intent-interactor.module'

@Module({
  imports: [
    TransferIntentRepositoryModule,
    TransferIntentCreateInteractorModule,
    ProcessHeldTransferIntentInteractorModule,
  ],
  controllers: [TransferIntentController],
})
export class TransferIntentControllerModule {}
