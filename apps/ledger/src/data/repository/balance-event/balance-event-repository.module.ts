import { Module } from '@nestjs/common'
import { BalanceEventRepository } from './balance-event-repository'
import {
  CoreJetstreamDataSourceModule,
} from '../../data-source/nats-jetstream/core/core-jetstream-data-source.module'

@Module({
  imports: [CoreJetstreamDataSourceModule],
  providers: [BalanceEventRepository],
  exports: [BalanceEventRepository],
})
export class BalanceEventRepositoryModule {}
