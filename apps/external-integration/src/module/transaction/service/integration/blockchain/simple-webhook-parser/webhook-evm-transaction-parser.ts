import { EvmBlockchain } from '../../../../../../api/controller/webhook/request/evm-transaction-webhook.request'
import { TransactionParser, TransactionParseResult } from '../../../transaction-parser/transaction-parser'
import { OperationType } from '../../../../model/transfer.model'
import {
  EvmAddress,
  EvmHashType,
  IntegrationCurrency,
  RawNumeric,
  type SourceTransactionId,
  IntegrationAccount,
} from '@app/types'
import { IntegrationType, TransactionStatus, ExecutionType } from '@app/shared'

export interface EvmTransactionWebhook {
  readonly chain: EvmBlockchain
  readonly from: EvmAddress
  readonly to: EvmAddress
  readonly currency: IntegrationCurrency
  readonly amount: RawNumeric
  readonly success: boolean
  readonly blockNumber: RawNumeric
  readonly blockHash: EvmHashType
  readonly index: number
  readonly hash: SourceTransactionId
  readonly timestamp: number
  readonly fee: RawNumeric
  readonly logs: ReadonlyArray<string> // some logs of transfers.
}

// just for example
export class WebhookEvmTransactionParser implements TransactionParser<EvmTransactionWebhook, TransactionParseResult> {
  public async parse(
    integration: IntegrationType,
    rawTransaction: EvmTransactionWebhook,
  ): Promise<TransactionParseResult> {
    // check all fields and validate
    // it just only for example
    return {
      transaction: {
        raw: JSON.stringify(rawTransaction),
        executionType: ExecutionType.NATIVE,
        integration,
        initiator: IntegrationAccount.create(integration, rawTransaction.from),
        sourceTxId: rawTransaction.hash,
        blockId: rawTransaction.blockNumber,
        blockTime: new Date(rawTransaction.timestamp * 1000),
        status: rawTransaction.success ? TransactionStatus.ACCEPTED : TransactionStatus.FAILED,
        fee: rawTransaction.fee,
        feeCurrency: 'native',
        metadata: {
          blockHash: rawTransaction.blockHash,
          txIndex: Number(rawTransaction.blockNumber),
          txFee: rawTransaction.fee,
          gasPrice: '0x0',
          gasUsed: '0x0',
          ver: 1,
        },
        transfers: [
          {
            integration,
            operation: OperationType.NATIVE_TRANSFER,
            index: rawTransaction.index,
            initiator: IntegrationAccount.create(integration, rawTransaction.from),
            from: IntegrationAccount.create(integration, rawTransaction.from),
            to: IntegrationAccount.create(integration, rawTransaction.to),
            fromOwner: IntegrationAccount.create(integration, rawTransaction.from),
            toOwner: IntegrationAccount.create(integration, rawTransaction.to),
            currency: rawTransaction.currency,
            amountRaw: rawTransaction.amount,
            transferIntentId: null,
            metadata: {},
          },
        ],
      },
    } satisfies TransactionParseResult
  }
}
