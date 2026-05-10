import { AbstractInteractor } from '@app/types'
import { TransferIntentData } from '../../model/transfer-intent.model'
import { Injectable } from '@nestjs/common'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { TxContextRunner } from '@app/shared'

export interface TransferIntentCreateParams extends TransferIntentData {}

@Injectable()
export class TransferIntentCreateInteractor extends AbstractInteractor<TransferIntentCreateParams, Promise<void>> {
  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly inbox: InboxRepository,
    private readonly transferIntentRepository: TransferIntentRepository,
  ) {
    super()
  }

  async execute(params: TransferIntentCreateParams): Promise<void> {
    await this.txRunner
      .create()
      .pipeline(async (ctx) => {
        const isUniqueEvent = await this.inbox.create(
          {
            serviceName: TransferIntentCreateInteractor.name,
            idempotencyKey: `${params.intentType}-${params.intentId}`,
          },
          ctx,
        )

        if (!isUniqueEvent) {
          return
        }

        await this.transferIntentRepository.create(params, ctx)
      })
      .execute()
  }
}
