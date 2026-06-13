import { AbstractInteractor, type UUID, Id } from '@app/types'
import { Injectable } from '@nestjs/common'
import { TransferIntentRepository } from '../../../../data/repository/transfer-intent/transfer-intent.repository'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { TxContextRunner, IntentType } from '@app/shared'
import { TransferRouteRepository } from '../../../../data/repository/transfer-route/transfer-route.repository'

export interface ProcessHeldTransferIntentData {
  readonly intentId: UUID
  readonly txId: Id
}

export interface ProcessHeldTransferIntentParams {
  readonly uniqueKey: string
  readonly intentType: IntentType
  readonly intentData: ReadonlyArray<ProcessHeldTransferIntentData>
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
    private readonly transferRouteRepository: TransferRouteRepository,
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
            idempotencyKey: params.uniqueKey,
          },
          ctx,
        )

        if (!isUniqueEvent) {
          return
        }
        const queryParams = params.intentData.map((item) => ({
          intentId: item.intentId,
          txId: item.txId,
        }))

        await this.transferRouteRepository.markAsHeld(queryParams, ctx)
      })
      .execute()
  }
}
