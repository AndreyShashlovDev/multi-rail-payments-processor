import { Numeric } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { TransactionStatus, OutboxTxContextRunner } from '@app/shared'
import { toError } from '@app/utils'
import { ExecuteTransferRouteCommand, TransferRouteFailedEvent } from '@app/shared/services/transfer-execution/v1'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { TransactionEventPublisher } from '../../../../data/publisher/transaction-event/transaction-event.publisher'
import { TransferRoutePublisher } from '../../../../data/publisher/transfer-route/transfer-route.publisher'
import { TransactionIntentRepository } from '../../repository/transaction-intent/transaction-intent.repository'
import { TransactionSaverStrategy } from '../../service/transaction-saver/transaction-saver.strategy'
import { TransferRouteTransactionBuilder } from '../../service/integration/transfer-route-transaction-builder.service'
import { TransactionIntentData } from '../../model/transaction-intent.model'
import { OperationType } from '../../model/transfer.model'
import { BasicTransactionInteractor } from '../basic-transaction.interactor'
import { TransactionEventMapper } from '../transaction-event.mapper'

@Injectable()
export class ExecuteTransferRouteInteractor extends BasicTransactionInteractor<ExecuteTransferRouteCommand> {
  private readonly logger: Logger = new Logger(ExecuteTransferRouteInteractor.name)

  constructor(
    private readonly txRunner: OutboxTxContextRunner,
    private readonly inbox: InboxRepository,
    private readonly transferRouteTransactionBuilder: TransferRouteTransactionBuilder,
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly transactionSaverStrategy: TransactionSaverStrategy,
    private readonly transactionEventPublisher: TransactionEventPublisher,
    private readonly transferRoutePublisher: TransferRoutePublisher,
  ) {
    super()
  }

  async execute(command: ExecuteTransferRouteCommand): Promise<void> {
    await this.txRunner
      .create()
      .pipeline(async (ctx) => {
        const isUniqueCommand = await this.inbox.create(
          { serviceName: ExecuteTransferRouteInteractor.name, idempotencyKey: command.uniqueKey },
          ctx,
        )

        if (!isUniqueCommand) {
          return
        }

        let tx: TransactionIntentData

        try {
          tx = await this.transferRouteTransactionBuilder.execute({
            integration: command.integration,
            executionType: command.executionType,
            from: command.from,
            to: command.to,
            currency: command.currency,
            rawAmount: command.rawAmount,
          })
        } catch (e) {
          // todo distinguish transient errors (RPC) from final ones and retry the transient
          this.logger.error(`transfer route ${command.transferRouteId} failed to build`, e)

          await this.transferRoutePublisher.enqueueFailed(
            new TransferRouteFailedEvent(command.transferRouteId, toError(e).message),
            ctx,
          )

          return
        }

        const transactionIntent = await this.transactionIntentRepository.create(tx, ctx)

        const transaction = await this.transactionSaverStrategy.save(
          {
            transaction: {
              executionType: transactionIntent.executionType,
              integration: transactionIntent.integration,
              sourceTxId: transactionIntent.sourceTxId,
              initiator: tx.initiator,
              blockId: null,
              blockTime: null,
              status: TransactionStatus.PREPARED,
              metadata: null,
              fee: tx.fee,
              feeCurrency: tx.feeCurrency,
              raw: JSON.stringify(transactionIntent),
              transfers: [
                {
                  integration: command.integration,
                  operation:
                    command.currency === 'native' ? OperationType.NATIVE_TRANSFER : OperationType.TOKEN_TRANSFER,
                  index: 0,
                  initiator: command.initiator,
                  from: command.from,
                  to: command.to,
                  fromOwner: command.from,
                  toOwner: command.to,
                  amountRaw: Numeric.create(command.rawAmount).toFixed(Numeric.DECIMALS),
                  currency: command.currency,
                  transferIntentId: command.intent.id,
                  transferRouteId: command.transferRouteId,
                  intentType: command.intent.intentType,
                  intentId: command.intent.intentId,
                  metadata: null,
                },
              ],
            },
          },
          ctx,
        )

        const result = { ...transaction, transfers: this.withIntent(transaction.transfers) }

        await this.transactionEventPublisher.enqueue(TransactionEventMapper.toEvent(result), ctx)
      })
      .execute()
  }
}
