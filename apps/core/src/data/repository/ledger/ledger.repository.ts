import { LedgerGrpcClient } from '../../data-source/grpc/ledger/ledger-grpc-client'
import { LedgerRepositoryMapper } from './ledger-repository.mapper'
import { ChangeBalanceData, BalanceUpdatedResult, GetBalancesResult } from './ledger-repository.types'
import { Injectable } from '@nestjs/common'
import {
  LedgerJetstreamDataSource,
  LedgerJetstreamHandler,
} from '../../data-source/nats-jetstream/ledger/ledger-jetstream.data-source'
import { IntegrationType, BalanceChangeType, IntentType, GetBalancesParams } from '@app/shared'
import {
  BalanceChangeRequestData,
  BalanceChangeRequestEvent,
  BalanceUpdatedEvent,
} from '@app/shared/services/ledger/v1'
import { balanceChangeSubject } from '@app/shared/nat-stream/balance-change-stream.types'
import { toError } from '@app/utils'

export interface BalanceUpdatedSubscription {
  readonly handler: (item: BalanceUpdatedResult) => Promise<void>
  readonly filter?: {
    readonly intentType?: IntentType
    readonly status?: ReadonlySet<BalanceChangeType>
  }
}

@Injectable()
export class LedgerRepository implements LedgerJetstreamHandler {
  private readonly subscriptions: BalanceUpdatedSubscription[] = []

  constructor(
    private readonly grpcClient: LedgerGrpcClient,
    private readonly ledgerJetstreamDataSource: LedgerJetstreamDataSource,
  ) {
    this.ledgerJetstreamDataSource.setupHandler(this)
  }

  async balanceUpdatedEventHandler(event: BalanceUpdatedEvent): Promise<void> {
    const validated = LedgerRepositoryMapper.balanceUpdatedEventValidate(event)
    const data = LedgerRepositoryMapper.eventToBalanceUpdatedResult(validated)

    const result = await Promise.allSettled(
      this.subscriptions.map(async (subscription) => {
        const { handler, filter } = subscription

        const filteredResult = {
          ...data,
          changes: data.changes.filter((item) => {
            let result: boolean = true

            if (result && filter?.intentType) {
              result = item.metadata.intentType === filter.intentType
            }

            if (result && filter?.status) {
              result = filter.status.has(item.type)
            }

            return result
          }),
        }

        if (filteredResult.changes.length > 0) {
          await handler(filteredResult)
        }
      }),
    )

    const failed = result.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

    if (failed.length > 0) {
      const reasons = failed.map((r) => toError(r.reason).message).join(', ')
      throw new Error(`${failed.length} handler(s) failed: ${reasons}`)
    }
  }

  async changeBalance(data: ChangeBalanceData): Promise<void> {
    const events = data.changes.reduce((acc, curr) => {
      const changes = acc.get(curr.integration) ?? []

      changes.push(LedgerRepositoryMapper.balanceChangeToEvent(curr))
      return acc.set(curr.integration, changes)
    }, new Map<IntegrationType, BalanceChangeRequestData[]>())

    for (const [integration, changes] of events) {
      await this.ledgerJetstreamDataSource.publish(
        balanceChangeSubject(integration),
        new BalanceChangeRequestEvent(data.idempotencyKey, integration, changes),
      )
    }
  }

  subscribeToChangeBalance(subscription: BalanceUpdatedSubscription): void {
    this.subscriptions.push(subscription)
  }

  async getBalances(params: GetBalancesParams): Promise<GetBalancesResult> {
    const request = LedgerRepositoryMapper.getBalancesFromDomain(params)
    const response = await this.grpcClient.getBalances(request)

    return LedgerRepositoryMapper.getBalancesToDomain(response)
  }
}
