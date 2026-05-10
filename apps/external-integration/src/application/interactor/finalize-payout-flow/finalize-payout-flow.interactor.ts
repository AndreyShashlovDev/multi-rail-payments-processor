import { AbstractInteractor, EvmHashType, Numeric, IntegrationAccount, EvmAddress } from '@app/types'
import { TransactionIntentRepository } from '../../../data/repository/transaction-intent/transaction-intent.repository'
import { OutboxTxContextRunner, ExecutionType } from '@app/shared'
import { WebhookAcceptTransactionInteractor } from '../../../module/transaction/interactor/webhook-accept-transaction/webhook-accept-transaction-interactor'
import { PromoteTransactionInteractor } from '../../../module/transaction/interactor/promote-transaction/promote-transaction.interactor'
import { SignTransactionInteractor } from '../../../module/transaction/interactor/sign-transaction/sign-transaction.interactor'
import { Injectable, Logger } from '@nestjs/common'
import { ConfirmTransactionInteractor } from '../../../module/transaction/interactor/confirm-transaction/confirm-transaction.interactor'
import { randomBytes } from 'node:crypto'
import { InternalBlockRepository } from '../../../data/repository/internal-block/internal-block.repository'

/**
 * @deprecated remove it in real project! just for example. simulation finalize tx
 */
// todo remove it in real project! just for example. simulation finalize tx
@Injectable()
export class FinalizePayoutFlowInteractor extends AbstractInteractor<never, Promise<void>> {
  private readonly logger: Logger = new Logger(FinalizePayoutFlowInteractor.name)

  constructor(
    private readonly txRunner: OutboxTxContextRunner,
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly signTransactionInteractor: SignTransactionInteractor,
    private readonly promoteTransactionInteractor: PromoteTransactionInteractor,
    private readonly acceptTransactionInteractor: WebhookAcceptTransactionInteractor,
    private readonly confirmTransactionInteractor: ConfirmTransactionInteractor,
    private readonly internalBlockRepository: InternalBlockRepository,
  ) {
    super()
    this.logger.warn(`Enabled FinalizePayoutFlowInteractor! Remove it!!`)
  }

  async execute(): Promise<void> {
    await this.txRunner
      .create()
      .pipeline(async (ctx) => {
        const txIntents = await this.transactionIntentRepository.findReadyForSign({ take: 10, skip: 0 }, ctx)

        if (txIntents.length === 0) {
          return
        }

        // check transferIntents on PREPARED and mark tx intent as ReadyForSigning
        await Promise.all(
          txIntents.map(
            async (intent) => await this.transactionIntentRepository.markReadyForSigning({ id: intent.id }, ctx),
          ),
        )
        // send query to custody service for sign payload
        await Promise.all(
          txIntents.map(async (intent) => await this.signTransactionInteractor.execute({ id: intent.id, ctx })),
        )

        // in incoming event from custody update all
        await Promise.all(
          txIntents.map(
            async (intent) =>
              await this.transactionIntentRepository.makeReadyToPromote(
                { id: intent.id, signedData: JSON.stringify(intent.rawData) },
                ctx,
              ),
          ),
        )

        // some logic send to some integration
        // sort by integration type + nonce
        await Promise.all(
          txIntents.map(
            async (intent) =>
              await this.promoteTransactionInteractor.execute({
                sourceTxId: intent.txId,
                integration: intent.integration,
                ctx,
              }),
          ),
        )

        // webhook/event from blockchain simulation
        await Promise.all(
          txIntents.map(async (intent) => {
            // for example support only one transfer per transaction!
            const blockNumber =
              intent.executionType === ExecutionType.INTERNAL
                ? await this.internalBlockRepository.incrementAndGet(intent.integration, ctx)
                : '33'

            const transfer = intent.transfers[0]

            await this.acceptTransactionInteractor.execute({
              integration: intent.integration,
              source: 'webhook',
              raw: {
                chain: 'ethereum',
                from: IntegrationAccount.create(intent.integration, transfer.fromAccount) as EvmAddress,
                to: IntegrationAccount.create(intent.integration, transfer.toAccount) as EvmAddress,
                currency: transfer.fromCurrency,
                fee:
                  intent.executionType === ExecutionType.INTERNAL
                    ? Numeric.ZERO.toString()
                    : Numeric.create('0.1').mul(Numeric.create(10).pow(18)).toString(),
                index: 0,
                amount: transfer.fromRawAmount,
                success: true,
                blockNumber,
                blockHash: randomBytes(32).toString('hex') as EvmHashType,
                hash: intent.txId,
                timestamp: Math.round(Date.now() / 1000),
              },
              ctx,
            })
          }),
        )

        await Promise.all(
          txIntents.map(
            async (intent) =>
              await this.confirmTransactionInteractor.execute({
                sourceTxId: intent.txId,
                integration: intent.integration,
                ctx,
              }),
          ),
        )
      })
      .execute()
  }
}
