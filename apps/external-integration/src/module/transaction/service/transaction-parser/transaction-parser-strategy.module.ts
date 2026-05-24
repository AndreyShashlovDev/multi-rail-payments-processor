import { Module, FactoryProvider } from '@nestjs/common'
import { WebhookEvmTransactionParserModule } from '../integration/blockchain/simple-webhook-parser/webhook-evm-transaction-parser.module'
import { TransactionParserStrategy, DataSourceType, RawDataType } from './transaction-parser.strategy'
import { WebhookEvmTransactionParser } from '../integration/blockchain/simple-webhook-parser/webhook-evm-transaction-parser'
import { TransactionParser, TransactionParseResult } from './transaction-parser'
import { IntegrationType } from '@app/shared'

const Provider: FactoryProvider = {
  provide: TransactionParserStrategy,
  inject: [WebhookEvmTransactionParser],
  useFactory: (webhookEvmTransactionParser: WebhookEvmTransactionParser) => {
    return new TransactionParserStrategy(
      new Map<DataSourceType, Map<IntegrationType, TransactionParser<RawDataType, TransactionParseResult>>>([
        [
          'webhook',
          new Map<IntegrationType, TransactionParser<RawDataType, TransactionParseResult>>([
            [IntegrationType.ETHEREUM, webhookEvmTransactionParser],
          ]),
        ],
      ]),
    )
  },
}

@Module({
  imports: [WebhookEvmTransactionParserModule],
  providers: [Provider],
  exports: [Provider],
})
export class TransactionParserStrategyModule {}
