import { Module } from '@nestjs/common'
import {
  CoreJetstreamDataSourceModule,
} from '../../data-source/nats-jetstream/core-jetstream-data-source.module'
import { TransactionEventRepository } from './transaction-event.repository'

@Module({
  imports: [CoreJetstreamDataSourceModule],
  providers: [TransactionEventRepository],
  exports: [TransactionEventRepository],
})
export class TransactionEventRepositoryModule {}
