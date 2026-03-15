import { Module } from '@nestjs/common'
import { WebhookController } from './webhook.controller'
import {
  WebhookAcceptTransactionInteractorModule,
} from '../../../module/transaction/interactor/webhook-accept-transaction/webhook-accept-transaction-interactor.module'
import {
  ConfirmTransactionInteractorModule,
} from '../../../module/transaction/interactor/confirm-transaction/confirm-transaction-interactor.module'

@Module({
  imports: [ConfirmTransactionInteractorModule, WebhookAcceptTransactionInteractorModule],
  controllers: [WebhookController],
})
export class WebhookControllerModule {}
