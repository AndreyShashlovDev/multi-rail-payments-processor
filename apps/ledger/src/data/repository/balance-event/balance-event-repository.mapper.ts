import { BalanceChangeRequestEvent } from '@app/shared/services/ledger/v1'
import { BalanceChangeEvent } from './balance-event-repository.types'
import { Numeric } from '@app/types'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

export class BalanceEventRepositoryMapper {
  static validateEvent(event: BalanceChangeRequestEvent): BalanceChangeRequestEvent {
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

  static toDomain(event: BalanceChangeRequestEvent): BalanceChangeEvent {
    return {
      ver: event.ver,
      uniqueKey: event.uniqueKey,
      integration: event.integration,
      changes: event.changes.map((change) => ({
        ...change,
        integration: event.integration,
        amount: Numeric.create(change.amount),
      })),
    }
  }
}
