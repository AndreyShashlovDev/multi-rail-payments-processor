import { Module } from '@nestjs/common'
import { PaymentIntentRepository } from './payment-intent.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogicPostgresConfig } from '../../data-source/postgres/logic-postgres.config'
import { PaymentIntentEntity } from '../../data-source/postgres/entities/payment-intent.entity'

@Module({
  imports: [TypeOrmModule.forFeature([PaymentIntentEntity], LogicPostgresConfig.DATASOURCE_NAME)],
  providers: [PaymentIntentRepository],
  exports: [PaymentIntentRepository],
})
export class PaymentIntentRepositoryModule {}
