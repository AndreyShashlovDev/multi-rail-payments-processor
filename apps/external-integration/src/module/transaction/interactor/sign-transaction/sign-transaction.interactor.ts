import { AbstractInteractor, Id } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TransactionIntentRepository } from '../../../../data/repository/transaction-intent/transaction-intent.repository'
import { TxContext } from '@app/shared/types/tx-context.type'
import { TransferRouteRepository } from '../../../../data/repository/transfer-route/transfer-route.repository'

export interface SignTransactionParams {
  readonly id: Id
  readonly ctx: TxContext // todo remove it from Interactor. just for finalize payout example
}

@Injectable()
export class SignTransactionInteractor extends AbstractInteractor<SignTransactionParams, Promise<void>> {
  constructor(
    private readonly transactionIntentRepository: TransactionIntentRepository,
    private readonly transferRouteRepository: TransferRouteRepository,
  ) {
    super()
  }

  async execute(params: SignTransactionParams): Promise<void> {
    const routesProcessing = await this.transferRouteRepository.markAsProcessing(params.id, params.ctx)

    if (!routesProcessing) {
      // todo
      throw new Error(`No one routes not processing for tx id: ${params.id}`)
    }

    await this.transactionIntentRepository.markSigning({ id: params.id }, params.ctx)
  }
}
