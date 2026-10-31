import { BalanceUpdatedEvent, BalanceFailedEvent, BalanceUpdatedDataEvent } from '@app/shared/services/ledger/v1'
import { BalanceChangeData } from '../../model/balance-change.data'
import { BalanceApplyError } from '../../repository/balance/balance-repository.types'

export class ProcessApplyBalanceMapper {
  static toUpdatedEvent(uniqueKey: string, changes: ReadonlyArray<BalanceChangeData>): BalanceUpdatedEvent {
    return new BalanceUpdatedEvent(
      uniqueKey,
      changes.map((item) => ProcessApplyBalanceMapper.toDataEvent(item)),
    )
  }

  static toFailedEvent(
    uniqueKey: string,
    changes: ReadonlyArray<BalanceChangeData>,
    errors: ReadonlyArray<BalanceApplyError>,
  ): BalanceFailedEvent {
    return new BalanceFailedEvent(
      uniqueKey,
      changes.map((item) => ProcessApplyBalanceMapper.toDataEvent(item)),
      errors,
    )
  }

  private static toDataEvent(item: BalanceChangeData): BalanceUpdatedDataEvent {
    return new BalanceUpdatedDataEvent(
      item.type,
      item.intentType,
      item.intentId,
      item.operationType,
      item.integration,
      item.platformAccountId,
      item.integrationAccount,
      item.currency,
      item.amount.toString(),
      item.metadata,
    )
  }
}
