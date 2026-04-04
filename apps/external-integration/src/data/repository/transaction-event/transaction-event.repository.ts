import { CoreJetstreamDataSource } from '../../data-source/nats-jetstream/core-jetstream.data-source'
import { Injectable } from '@nestjs/common'
import { transactionSubject } from '@app/shared'
import { TransactionEventRepositoryMapper } from './transaction-event-repository.mapper'
import { TransactionEventData } from './transaction-event-repository.types'

@Injectable()
export class TransactionEventRepository {
  constructor(private readonly source: CoreJetstreamDataSource) {}

  async publish(tx: TransactionEventData): Promise<void> {
    const event = TransactionEventRepositoryMapper.transactionToEvent(tx)

    await this.source.publish(transactionSubject(tx.integration), event)
  }
}
