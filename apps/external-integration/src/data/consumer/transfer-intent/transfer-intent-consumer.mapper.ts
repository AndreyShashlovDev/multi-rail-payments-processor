import { plainToInstance } from 'class-transformer'
import { TransferIntentCreateEvent } from '@app/shared/services/external-integration/v1'
import { validateSync } from 'class-validator'
import { TransferIntentEventModel, TransferIntentEventKeyType } from './transfer-intent-consumer.types'
import { TransferIntentHeldEvent } from '@app/shared/services/external-integration/v1/event/transfer-intent-held.event'
import { TransferIntentCreateEventModel } from '../../../module/transfer-intent/model/transfer-intent.create-event.model'
import { TransferIntentHeldEventModel } from '../../../module/transfer-intent/model/transfer-intent-held-event.model'
import { JsonObject } from '@app/types'
import { TransferIntentIncomingEventType } from '../../data-source/nats-jetstream/core-jetstream.data-source'

export class TransferIntentConsumerMapper {
  static async validateTransferIntentEvent<T extends TransferIntentEventKeyType>(
    type: T,
    event: JsonObject<TransferIntentIncomingEventType>,
  ): Promise<TransferIntentEventModel<T>> {
    if (type === 'create') {
      const instance = plainToInstance(TransferIntentCreateEvent, event, {
        exposeDefaultValues: true,
      })

      await TransferIntentConsumerMapper.validate(instance)

      return {
        ...instance,
        fromRawAmount: instance.fromAmount,
        toRawAmount: instance.toAmount,
      } satisfies TransferIntentCreateEventModel as unknown as TransferIntentEventModel<T>
    } else if (type === 'held') {
      const instance = plainToInstance(TransferIntentHeldEvent, event, {
        exposeDefaultValues: true,
      })

      await TransferIntentConsumerMapper.validate(instance)

      return {
        intentType: instance.intentType,
        intentIds: new Set(instance.intentIds),
      } satisfies TransferIntentHeldEventModel as unknown as TransferIntentEventModel<T>
    }

    throw new Error(`Unsupported transfer intent event type: ${type}`)
  }

  private static async validate(instance: object): Promise<void> {
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: false,
    })

    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('; ')}`,
      )
    }
  }
}
