import { Module } from '@nestjs/common'
import { WebhookEvmTransactionParser } from './webhook-evm-transaction-parser'

@Module({
  providers: [WebhookEvmTransactionParser],
  exports: [WebhookEvmTransactionParser],
})
export class WebhookEvmTransactionParserModule {}
