import { AbstractInteractor } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { TxContextRunner } from '@app/shared'
import { TransferRouteFailedEvent } from '@app/shared/services/transfer-execution/v1'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { TransferIntentRepository } from '../../repository/transfer-intent/transfer-intent.repository'
import { TransferRouteRepository } from '../../repository/transfer-route/transfer-route.repository'

// The executor could not start the step (no transaction exists): fail the step and the intent.
@Injectable()
export class ProcessTransferRouteFailedInteractor extends AbstractInteractor<TransferRouteFailedEvent, Promise<void>> {
  private readonly logger: Logger = new Logger(ProcessTransferRouteFailedInteractor.name)

  constructor(
    private readonly txRunner: TxContextRunner,
    private readonly inbox: InboxRepository,
    private readonly transferIntentRepository: TransferIntentRepository,
    private readonly transferRouteRepository: TransferRouteRepository,
  ) {
    super()
  }

  async execute(event: TransferRouteFailedEvent): Promise<void> {
    await this.txRunner
      .create()
      .pipeline(async (ctx) => {
        const isUniqueEvent = await this.inbox.create(
          { serviceName: ProcessTransferRouteFailedInteractor.name, idempotencyKey: event.uniqueKey },
          ctx,
        )

        if (!isUniqueEvent) {
          return
        }

        const route = await this.transferRouteRepository.getById(event.transferRouteId, ctx)

        if (!route) {
          this.logger.warn(`transfer route ${event.transferRouteId} not found`)
          return
        }

        await this.transferIntentRepository.lock(route.transferIntentId, ctx)

        if (!(await this.transferRouteRepository.markAsFailed(route.id, ctx))) {
          return
        }

        this.logger.error(`transfer route ${route.id} failed: ${event.reason}`)

        // todo compensation (e.g. the Core payment created for a relayer step)
        await this.transferIntentRepository.markAsFailed({ id: route.transferIntentId }, ctx)
      })
      .execute()
  }
}
