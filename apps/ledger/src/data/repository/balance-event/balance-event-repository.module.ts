import { Module } from '@nestjs/common'
import { BalanceEventRepository } from './balance-event-repository'
import {
  LogicJetstreamDataSourceModule,
} from '../../data-source/nats-jetstream/logic/logic-jetstream-data-source.module'

@Module({
  imports: [LogicJetstreamDataSourceModule],
  providers: [BalanceEventRepository],
  exports: [BalanceEventRepository],
})
export class BalanceEventRepositoryModule {}
