import { BalanceUpdatedResult, GetBalancesResult } from './ledger-repository.types'
import { BalanceChangeMetadata, BalanceChange, BalanceChangeReason } from '@app/shared/types/balance-change'
import { BalanceChangeRequestData, BalanceUpdatedEvent } from '@app/shared/services/ledger/v1'
import { Numeric, UUID, Id, IntegrationCurrency, IntegrationAccount } from '@app/types'
import { GetBalancesParams, Balance, IntegrationType } from '@app/shared'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { GetBalancesRequest, GetBalancesResponse } from '@app/shared/services/ledger/v1/grpc/generated/balance'
import { BalanceChangeDataMetadata } from '@app/shared/services/ledger/v1/event/balance-change-metadata.type'

export class LedgerRepositoryMapper {
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
        metadata: {
          txId: item.metadata.txId as Id,
          reason: item.metadata.reason
            ? (BalanceChangeReason[item.metadata.reason.toString()] as BalanceChangeReason)
            : undefined,
          transferIds: Array.isArray(item.metadata.transferIds) ? item.metadata.transferIds : undefined,
          overpay: item.metadata.overpay ? Numeric.create(item.metadata.overpay) : undefined,
          actualAmount: item.metadata.actualAmount ? Numeric.create(item.metadata.actualAmount) : undefined,
          expectedAmount: item.metadata.expectedAmount ? Numeric.create(item.metadata.expectedAmount) : undefined,
          relatedIntentId: item.metadata.relatedIntentId,
          relatedIntentType: item.metadata.relatedIntentType,
          integrationFeeDiff: item.metadata.integrationFeeDiff
            ? Numeric.create(item.metadata.integrationFeeDiff)
            : undefined,
          txStatus: item.metadata.txStatus,
        },
      })),
    }
  }

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
      LedgerRepositoryMapper.metadataToJson(data.metadata),
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

  static getBalancesFromDomain(params: GetBalancesParams): GetBalancesRequest {
    const platform = (params.platform ?? []).map((item) => ({
      ...item,
      currencies: Array.from(item.currencies),
    }))

    const integration = (params.integration ?? []).map((item) => ({
      ...item,
      currencies: Array.from(item.currencies),
    }))

    return { platform, integration }
  }

  static getBalancesToDomain(response: GetBalancesResponse): GetBalancesResult {
    const platform = (response.platform ?? []).reduce((acc, current) => {
      const accountId = current.accountId as UUID
      const integration = current.integration as IntegrationType

      const mapByAccount = acc.get(accountId) ?? new Map<IntegrationType, Map<IntegrationCurrency, Balance>>()
      const mapByIntegration = mapByAccount.get(integration) ?? new Map<IntegrationCurrency, Balance>()
      const balance: Balance = {
        balance: Numeric.create(current.balance),
        available: Numeric.create(current.available),
        hold: Numeric.create(current.hold),
        holdIn: Numeric.create(current.holdIn),
      }

      mapByIntegration.set(current.currency as IntegrationCurrency, balance)
      mapByAccount.set(integration, mapByIntegration)

      return acc.set(accountId, mapByAccount)
    }, new Map<UUID, Map<IntegrationType, Map<IntegrationCurrency, Balance>>>())

    const integration = (response.integration ?? []).reduce((acc, current) => {
      const account = current.account as IntegrationAccount
      const integration = current.integration as IntegrationType

      const mapByAccount = acc.get(account) ?? new Map<IntegrationType, Map<IntegrationCurrency, Balance>>()
      const mapByIntegration = mapByAccount.get(integration) ?? new Map<IntegrationCurrency, Balance>()
      const balance: Balance = {
        balance: Numeric.create(current.balance),
        available: Numeric.create(current.available),
        hold: Numeric.create(current.hold),
        holdIn: Numeric.create(current.holdIn),
      }

      mapByIntegration.set(current.currency as IntegrationCurrency, balance)
      mapByAccount.set(integration, mapByIntegration)

      return acc.set(account, mapByAccount)
    }, new Map<IntegrationAccount, Map<IntegrationType, Map<IntegrationCurrency, Balance>>>())

    return { platform, integration }
  }
}
