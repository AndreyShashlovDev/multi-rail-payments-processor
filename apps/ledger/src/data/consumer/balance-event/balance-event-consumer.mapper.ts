import { BalanceChangeRequestEvent } from '@app/shared/services/ledger/v1'
import { JsonObject } from '@app/types'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

export class BalanceEventConsumerMapper {
  static validateEvent(event: JsonObject<BalanceChangeRequestEvent>): BalanceChangeRequestEvent {
    const instance = plainToInstance(BalanceChangeRequestEvent, event, {
      exposeDefaultValues: true,
    })

    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: false,
    })

    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('; ')}`,
      )
    }
    return instance
  }
}
