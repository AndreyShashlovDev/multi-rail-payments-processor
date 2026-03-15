import { Module } from '@nestjs/common'
import { PayoutIntentRepository } from './payout-intent.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PayoutIntentEntity } from '../../data-source/postgres/entities/payout-intent.entity'
import { LogicPostgresConfig } from '../../data-source/postgres/logic-postgres.config'

@Module({
  imports: [TypeOrmModule.forFeature([PayoutIntentEntity], LogicPostgresConfig.DATASOURCE_NAME)],
  providers: [PayoutIntentRepository],
  exports: [PayoutIntentRepository],
})
export class PayoutIntentRepositoryModule {}
