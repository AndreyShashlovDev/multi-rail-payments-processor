import { Module } from '@nestjs/common'
import { PaymentAmountAccumulatorRepository } from './payment-amount-accumulator.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { PaymentAmountAccumulatorEntity } from '../../data-source/postgres/entities/payment-amount-accumulator.entity'

@Module({
  imports: [TypeOrmModule.forFeature([PaymentAmountAccumulatorEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [PaymentAmountAccumulatorRepository],
  exports: [PaymentAmountAccumulatorRepository],
})
export class PaymentAmountAccumulatorRepositoryModule {}
