import { EvmTransactionWebhookRequest, EvmBlockchain } from './request/evm-transaction-webhook.request'
import { IntegrationType } from '@app/shared'
import {
  AcceptTransactionParams,
} from '../../../module/transaction/interactor/webhook-accept-transaction/webhook-accept-transaction-interactor'
import { RawDataType } from '../../../module/transaction/service/transaction-parser/transaction-parser.strategy'

export class WebhookControllerMapper {
  static toCreateTransactionParams(request: EvmTransactionWebhookRequest): AcceptTransactionParams {
    return {
      integration: WebhookControllerMapper.evmBlockchainToIntegration(request.chain),
      source: 'webhook',
      // fixme
      raw: request as unknown as RawDataType,
    }
  }

  private static evmBlockchainToIntegration(blockchain: EvmBlockchain): IntegrationType {
    switch (blockchain) {
      case 'ethereum':
        return IntegrationType.ETHEREUM

      default: {
        const _exhaustive: never = blockchain
        throw new Error(`Unhandled blockchain type: ${String(_exhaustive)}`)
      }
    }
  }
}
