import { AbstractInteractor, type UUID } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { TxContextRunner, IntentType } from '@app/shared'

export interface ProcessHeldTransferIntentParams {
  readonly intentType: IntentType
  readonly intentIds: ReadonlySet<UUID>
}

@Injectable()
export class ProcessHeldTransferIntentInteractor extends AbstractInteractor<
  ProcessHeldTransferIntentParams,
  Promise<void>
> {
  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly inbox: InboxRepository,
    private readonly transferIntentRepository: TransferIntentRepository,
  ) {
    super()
  }

  async execute(params: ProcessHeldTransferIntentParams): Promise<void> {
    await this.txRunner
      .create()
      .pipeline(async (ctx) => {
        const isUniqueEvent = await this.inbox.create(
          {
            serviceName: ProcessHeldTransferIntentInteractor.name,
            idempotencyKey: `${params.intentType}-${Array.from(params.intentIds).join(',')}`,
          },
          ctx,
        )

        if (!isUniqueEvent) {
          return
        }
        await this.transferIntentRepository.markAsPrepared(params, ctx)
      })
      .execute()
  }
}
