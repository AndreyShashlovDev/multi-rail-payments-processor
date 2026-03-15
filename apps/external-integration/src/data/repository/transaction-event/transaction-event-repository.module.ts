import { Module } from '@nestjs/common'
import {
  LogicJetstreamDataSourceModule,
} from '../../data-source/nats-jetstream/logic-jetstream-data-source.module'
import { TransactionEventRepository } from './transaction-event.repository'

@Module({
  imports: [LogicJetstreamDataSourceModule],
  providers: [TransactionEventRepository],
  exports: [TransactionEventRepository],
})
export class TransactionEventRepositoryModule {}
