import { BalanceUpdatedResult } from './ledger-consumer.types'
import { BalanceChangeMetadata } from '@app/shared/types/balance-change'
import { BalanceUpdatedEvent } from '@app/shared/services/ledger/v1'
import { Numeric } from '@app/types'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { BalanceChangeDataMetadata } from '@app/shared/services/ledger/v1/event/balance-change-metadata.type'

export class LedgerConsumerMapper {
  static balanceUpdatedEventValidate<T extends BalanceUpdatedEvent>(event: T): BalanceUpdatedEvent {
    // check by txEvent.ver
    const instance = plainToInstance(BalanceUpdatedEvent, event, {
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

  static eventToBalanceUpdatedResult(data: BalanceUpdatedEvent): BalanceUpdatedResult {
    return {
      idempotencyKey: data.uniqueKey,
      ver: data.ver,
      changes: data.changes.map((item) => ({
        ...item,
        integration: item.integration,
        amount: Numeric.create(item.amount),
        metadata: LedgerConsumerMapper.mapMetadata(item.metadata),
      })),
    }
  }

  private static mapMetadata(metadata: BalanceChangeDataMetadata): BalanceChangeMetadata {
    return {
      ...metadata,
      overpay: metadata.overpay ? Numeric.create(metadata.overpay) : undefined,
      expectedAmount: metadata.expectedAmount ? Numeric.create(metadata.expectedAmount) : undefined,
      integrationFeeDiff: metadata.integrationFeeDiff ? Numeric.create(metadata.integrationFeeDiff) : undefined,
    }
  }
}
