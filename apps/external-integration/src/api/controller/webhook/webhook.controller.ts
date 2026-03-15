import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common'
import { EvmTransactionWebhookRequest } from './request/evm-transaction-webhook.request'
import { WebhookControllerMapper } from './webhook-controller.mapper'
import {
  ConfirmTransactionInteractor,
} from '../../../module/transaction/interactor/confirm-transaction/confirm-transaction.interactor'
import {
  WebhookAcceptTransactionInteractor,
} from '../../../module/transaction/interactor/webhook-accept-transaction/webhook-accept-transaction-interactor'

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly acceptTransactionInteractor: WebhookAcceptTransactionInteractor,
    private readonly confirmTransactionInteractor: ConfirmTransactionInteractor,
  ) {}

  @Post('evm-some-external-service')
  @HttpCode(HttpStatus.CREATED)
  async catchEthereumWebhook(@Body() request: EvmTransactionWebhookRequest): Promise<void> {
    const data = WebhookControllerMapper.toCreateTransactionParams(request)

    await this.acceptTransactionInteractor.execute(data)
  }
}
