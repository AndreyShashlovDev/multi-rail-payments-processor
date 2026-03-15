import { TransactionParser, TransactionParseResult } from './transaction-parser'
import { IntegrationType } from '@app/shared'
import { EvmTransactionWebhook } from '../../integration/blockchain/simple-webhook-parser/webhook-evm-transaction-parser'

export type DataSourceType = 'webhook'

export type RawDataType = EvmTransactionWebhook

export class TransactionParserStrategy {
  constructor(
    private readonly parsers: Map<
      DataSourceType,
      Map<IntegrationType, TransactionParser<RawDataType, TransactionParseResult>>
    >,
  ) {}

  async parse(
    source: DataSourceType,
    integration: IntegrationType,
    rawData: RawDataType,
  ): Promise<TransactionParseResult> {
    const parser = this.parsers.get(source)?.get(integration)

    if (!parser) {
      throw new Error(`Not implemented transaction parser for source: ${source} and integration: ${integration}`)
    }

    return await parser.parse(integration, rawData)
  }
}
