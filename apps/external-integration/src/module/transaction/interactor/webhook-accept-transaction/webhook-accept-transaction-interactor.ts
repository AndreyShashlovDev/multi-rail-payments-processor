import { Injectable } from '@nestjs/common'
import { TransactionEventPublisher } from '../../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransactionParserStrategy, RawDataType } from '../../service/transaction-parser/transaction-parser.strategy'
import { TransactionSaverStrategy } from '../../service/transaction-saver/transaction-saver.strategy'
import { IntegrationType, TransactionStatus, OutboxTxContextRunner } from '@app/shared'
import { IntegrationAccountRepository } from '../../../../data/repository/integration-account/integration-account.repository'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { BasicTransactionInteractor } from '../basic-transaction.interactor'
import { TransactionIntentRepository } from '../../../../data/repository/transaction-intent/transaction-intent.repository'
import { TxContext } from '@app/shared/types/tx-context.type'

export interface AcceptTransactionParams {
  readonly integration: IntegrationType
  readonly source: 'webhook'
  readonly raw: RawDataType
  readonly ctx?: TxContext // todo remove it from Interactor. just for finalize payout example
}

@Injectable()
export class WebhookAcceptTransactionInteractor extends BasicTransactionInteractor<AcceptTransactionParams> {
  constructor(
    private readonly txRunner: OutboxTxContextRunner,
    private readonly transactionEventPublisher: TransactionEventPublisher,
    private readonly transactionParser: TransactionParserStrategy,
    private readonly transactionSaver: TransactionSaverStrategy,
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly integrationAccountRepository: IntegrationAccountRepository,
    transferIntentRepository: TransferIntentRepository,
  ) {
    super(transferIntentRepository)
  }

  async execute(params: AcceptTransactionParams): Promise<void> {
    const parsedTransaction = await this.transactionParser.parse(params.source, params.integration, params.raw)
    // this.integrationAccountRepository.hasAccounts() - todo call for check before save and publish event (grpc request to Core)

    //todo const parse logs (or account record of Solana). looking for bridge (relayer) deposit event (extract deposit id)
    // update transfer intent with deposit id
    await this.txRunner
      .create(params.ctx)
      .pipeline(async (ctx) => {
        const transaction = await this.transactionSaver.save(
          {
            ...parsedTransaction,
            transaction: {
              ...parsedTransaction.transaction,
              status: TransactionStatus.ACCEPTED,
            },
          },
          ctx,
        )

        await this.transactionIntentRepository.markCompleted(
          { sourceTxId: transaction.sourceTxId, integration: transaction.integration },
          ctx,
        )

        const transfers = await this.mergeTransfersWithTransferIntent(transaction.transfers, params.ctx)

        const result = { ...transaction, transfers }

        await this.transactionEventPublisher.enqueue(result, ctx)
      })
      .execute()
  }
}
