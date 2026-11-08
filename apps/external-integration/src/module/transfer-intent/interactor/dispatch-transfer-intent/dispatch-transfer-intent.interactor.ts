import { AbstractInteractor } from '@app/types'
import { Injectable } from '@nestjs/common'
import { OutboxTxContextRunner } from '@app/shared'
import { TransferIntentRepository } from '../../repository/transfer-intent/transfer-intent.repository'
import { TransferRouteRepository } from '../../repository/transfer-route/transfer-route.repository'
import { TransferRoutePlanner } from '../../service/transfer-route-planner/transfer-route-planner.service'
import { TransferRoutePublisher } from '../../../../data/publisher/transfer-route/transfer-route.publisher'
import { TransferRouteCommandMapper } from '../transfer-route-command.mapper'

// Claims a transfer intent, plans its steps (transfer routes) and starts the first one.
// The next steps are started by ProcessTransferRouteCompletedInteractor when the previous one is completed.
@Injectable()
export class DispatchTransferIntentInteractor extends AbstractInteractor<never, Promise<void>> {
  constructor(
    private readonly contextRunner: OutboxTxContextRunner,
    private readonly transferIntentRepository: TransferIntentRepository,
    private readonly transferRoutePlanner: TransferRoutePlanner,
    private readonly transferRouteRepository: TransferRouteRepository,
    private readonly transferRoutePublisher: TransferRoutePublisher,
  ) {
    super()
  }

  async execute(): Promise<void> {
    await this.contextRunner
      .create()
      .pipeline(async (ctx) => {
        const transferIntent = await this.transferIntentRepository.claimOne(ctx)

        if (!transferIntent) {
          return
        }

        const routes = await this.transferRoutePlanner.execute([transferIntent])

        await this.transferRouteRepository.create(routes, ctx)

        const firstRoute = await this.transferRouteRepository.claimNext(transferIntent.id, ctx)

        if (!firstRoute) {
          throw new Error(`No routes planned for transfer intent ${transferIntent.id}`)
        }

        await this.transferRoutePublisher.enqueueExecute(
          TransferRouteCommandMapper.toCommand(firstRoute, transferIntent),
          ctx,
        )
      })
      .execute()
  }
}
