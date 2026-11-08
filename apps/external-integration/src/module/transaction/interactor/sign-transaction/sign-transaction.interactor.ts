import { AbstractInteractor, Id } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TransactionIntentRepository } from '../../repository/transaction-intent/transaction-intent.repository'
import { TxContext } from '@app/shared/types/tx-context.type'

export interface SignTransactionParams {
  readonly id: Id
  readonly ctx: TxContext // todo remove it from Interactor. just for finalize payout example
}

@Injectable()
export class SignTransactionInteractor extends AbstractInteractor<SignTransactionParams, Promise<void>> {
  constructor(private readonly transactionIntentRepository: TransactionIntentRepository) {
    super()
  }

  async execute(params: SignTransactionParams): Promise<void> {
    const marked = await this.transactionIntentRepository.markSigning({ id: params.id }, params.ctx)

    if (!marked) {
      throw new Error(`Transaction intent not marked as signing: ${params.id}`)
    }
  }
}
