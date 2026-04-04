import { Module } from '@nestjs/common'
import { PayoutIntentRepository } from './payout-intent.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PayoutIntentEntity } from '../../data-source/postgres/entities/payout-intent.entity'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'

@Module({
  imports: [TypeOrmModule.forFeature([PayoutIntentEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [PayoutIntentRepository],
  exports: [PayoutIntentRepository],
})
export class PayoutIntentRepositoryModule {}
