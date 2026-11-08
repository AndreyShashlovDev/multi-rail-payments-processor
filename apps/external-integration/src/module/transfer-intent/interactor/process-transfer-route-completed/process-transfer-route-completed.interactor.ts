import { AbstractInteractor } from '@app/types'
import { Injectable, Logger } from '@nestjs/common'
import { OutboxTxContextRunner } from '@app/shared'
import { TransferRouteCompletedEvent } from '@app/shared/services/transfer-execution/v1'
import { InboxRepository } from '../../../../data/repository/inbox/inbox.repository'
import { TransferRoutePublisher } from '../../../../data/publisher/transfer-route/transfer-route.publisher'
import { TransferIntentRepository } from '../../repository/transfer-intent/transfer-intent.repository'
import { TransferRouteRepository } from '../../repository/transfer-route/transfer-route.repository'
import { TransferRoutePlanner } from '../../service/transfer-route-planner/transfer-route-planner.service'
import { TransferRouteCommandMapper } from '../transfer-route-command.mapper'

// A step is completed: store its result, then start the next step resolved from the results so far,
// or complete the transfer intent when it was the last step.
@Injectable()
export class ProcessTransferRouteCompletedInteractor extends AbstractInteractor<
  TransferRouteCompletedEvent,
  Promise<void>
> {
  private readonly logger: Logger = new Logger(ProcessTransferRouteCompletedInteractor.name)

  constructor(
    private readonly txRunner: OutboxTxContextRunner,
    private readonly inbox: InboxRepository,
    private readonly transferIntentRepository: TransferIntentRepository,
    private readonly transferRouteRepository: TransferRouteRepository,
    private readonly transferRoutePlanner: TransferRoutePlanner,
    private readonly transferRoutePublisher: TransferRoutePublisher,
  ) {
    super()
  }

  async execute(event: TransferRouteCompletedEvent): Promise<void> {
    await this.txRunner
      .create()
      .pipeline(async (ctx) => {
        const isUniqueEvent = await this.inbox.create(
          { serviceName: ProcessTransferRouteCompletedInteractor.name, idempotencyKey: event.uniqueKey },
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

        const transferIntent = await this.transferIntentRepository.lock(route.transferIntentId, ctx)

        if (!transferIntent) {
          throw new Error(`Transfer intent ${route.transferIntentId} not found for route ${route.id}`)
        }

        const completed = await this.transferRouteRepository.markAsCompleted(
          { id: route.id, txId: event.txId, result: event.result },
          ctx,
        )

        if (!completed) {
          return // already completed
        }

        if (await this.transferRouteRepository.isAllCompleted(transferIntent.id, ctx)) {
          if (!(await this.transferIntentRepository.markAsCompleted({ id: transferIntent.id }, ctx))) {
            throw new Error(`Transfer intent not marked as Completed! transfer intent id: ${transferIntent.id}`)
          }

          return
        }

        const nextRoute = await this.transferRouteRepository.claimNext(transferIntent.id, ctx)

        if (!nextRoute) {
          throw new Error(`No next transfer route for transfer intent ${transferIntent.id}`)
        }

        const resolvedRoute = this.transferRoutePlanner.resolveNext(
          nextRoute,
          await this.transferRouteRepository.getCompleted(transferIntent.id, ctx),
        )

        await this.transferRouteRepository.saveResolved(resolvedRoute, ctx)

        await this.transferRoutePublisher.enqueueExecute(
          TransferRouteCommandMapper.toCommand(resolvedRoute, transferIntent),
          ctx,
        )
      })
      .execute()
  }
}
