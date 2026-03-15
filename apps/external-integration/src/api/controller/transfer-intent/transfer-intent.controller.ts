import { Controller } from '@nestjs/common'
import { TransferIntentRepository } from '../../../data/repository/transfer-intent/transfer-intent.repository'
import {
  TransferIntentCreateEventModel,
} from '../../../module/transfer-intent/model/transfer-intent.create-event.model'
import { TransferIntentHeldEventModel } from '../../../module/transfer-intent/model/transfer-intent-held-event.model'
import {
  TransferIntentCreateInteractor,
} from '../../../module/transfer-intent/interactor/create-transfer-intent/transfer-intent-create.interactor'
import {
  ProcessHeldTransferIntentInteractor,
} from '../../../module/transfer-intent/interactor/process-held-transfer-intent/process-held-transfer-intent.interactor'

@Controller()
export class TransferIntentController {
  constructor(
    transferIntentRepository: TransferIntentRepository,
    private readonly transferIntentCreateInteractor: TransferIntentCreateInteractor,
    private readonly processHeldTransferIntentInteractor: ProcessHeldTransferIntentInteractor,
  ) {
    transferIntentRepository.subscribeToTransferIntentEvent<'create'>({
      filter: { type: 'create' },
      handler: async (data) => await this.handleTransferIntentCreateEvent(data),
    })

    transferIntentRepository.subscribeToTransferIntentEvent<'held'>({
      filter: { type: 'held' },
      handler: async (data) => await this.handleTransferIntentHeldEvent(data),
    })
  }

  async handleTransferIntentCreateEvent(data: TransferIntentCreateEventModel): Promise<void> {
    await this.transferIntentCreateInteractor.execute({
      ...data,
      fromAccount: data.from,
      toAccount: data.to,
    })
  }

  async handleTransferIntentHeldEvent(data: TransferIntentHeldEventModel): Promise<void> {
    await this.processHeldTransferIntentInteractor.execute(data)
  }
}
