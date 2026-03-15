import { Injectable } from '@nestjs/common'
import { TransactionEventRepository } from '../../../../data/repository/transaction-event/transaction-event.repository'
import { TransactionParserStrategy, RawDataType } from '../../service/transaction-parser/transaction-parser.strategy'
import { TransactionSaverStrategy } from '../../service/transaction-saver/transaction-saver.strategy'
import { IntegrationType, TransactionStatus, TxContextRunner } from '@app/shared'
import {
  IntegrationAccountRepository,
} from '../../../../data/repository/integration-account/integration-account.repository'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { BasicTransactionInteractor } from '../basic-transaction.interactor'
import {
  TransactionIntentRepository,
} from '../../../../data/repository/transaction-intent/transaction-intent.repository'
import { TransactionModel } from '../../model/transaction.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import {
  TransferEventWithIntent,
} from '../../../../data/repository/transaction-event/transaction-event-repository.types'

export interface AcceptTransactionParams {
  readonly integration: IntegrationType
  readonly source: 'webhook'
  readonly raw: RawDataType
  readonly ctx?: TxContext // todo remove it from Interactor. just for finalize payout example
}

@Injectable()
export class WebhookAcceptTransactionInteractor extends BasicTransactionInteractor<AcceptTransactionParams> {
  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly transactionEventRepository: TransactionEventRepository,
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
    // this.integrationAccountRepository.hasAccounts() - todo call for check before save and publish event (grpc request to Logic)

    const result = await this.txRunner
      .createWithData<{ tx: TransactionModel; transfers: ReadonlyArray<TransferEventWithIntent> }>(
        undefined,
        params.ctx,
      )
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
          { txId: transaction.sourceTxId, integration: transaction.integration },
          ctx,
        )

        const transfers = await this.mergeTransfersWithTransferIntent(transaction.transfers, params.ctx)

        return { tx: transaction, transfers }
      })
      .execute()

    await this.transactionEventRepository.publish({ ...result.tx, transfers: result.transfers })
  }
}
