import { Module } from '@nestjs/common'
import { PaymentIntentRepository } from './payment-intent.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { PaymentIntentEntity } from '../../data-source/postgres/entities/payment-intent.entity'

@Module({
  imports: [TypeOrmModule.forFeature([PaymentIntentEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [PaymentIntentRepository],
  exports: [PaymentIntentRepository],
})
export class PaymentIntentRepositoryModule {}
