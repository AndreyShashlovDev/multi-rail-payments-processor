import { BalanceChange, BalanceChangeMetadata } from '@app/shared/types/balance-change'
import { BalanceChangeRequestData } from '@app/shared/services/ledger/v1'
import { BalanceChangeDataMetadata } from '@app/shared/services/ledger/v1/event/balance-change-metadata.type'
import { Numeric } from '@app/types'

export class LedgerPublisherMapper {
  static balanceChangeToEvent(data: BalanceChange): BalanceChangeRequestData {
    return new BalanceChangeRequestData(
      data.type,
      data.intentType,
      data.intentId,
      data.operationType,
      data.platformAccountId,
      data.integrationAccount,
      data.currency,
      data.amount.toString(),
      LedgerPublisherMapper.metadataToJson(data.metadata),
    )
  }

  private static metadataToJson(metadata: BalanceChangeMetadata): BalanceChangeDataMetadata {
    return JSON.parse(
      JSON.stringify(metadata, (key: string, value: unknown): unknown => {
        if (value === null || value === undefined) return undefined

        if (
          (typeof value === 'object' && !(value instanceof Set) && !Numeric.isNumeric(value)) ||
          typeof value === 'string'
        ) {
          return value
        }

        if (value instanceof Set) return [...value].map(String)
        if (typeof value === 'number') return value
        if (Numeric.isNumeric(value)) {
          return (value as Numeric).toString()
        }

        throw new Error(`unsupported value type key: ${key}, value: ${JSON.stringify(value)}`)
      }),
    ) as BalanceChangeDataMetadata
  }
}
