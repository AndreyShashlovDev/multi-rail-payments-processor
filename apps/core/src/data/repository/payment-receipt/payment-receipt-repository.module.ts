import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { PaymentReceiptRepository } from './payment-receipt.repository'
import { PaymentReceiptEntity } from '../../data-source/postgres/entities/payment-receipt.entity'

@Module({
  imports: [TypeOrmModule.forFeature([PaymentReceiptEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [PaymentReceiptRepository],
  exports: [PaymentReceiptRepository],
})
export class PaymentReceiptRepositoryModule {}
