import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { PaymentInboxTransferEntity } from '../../data-source/postgres/entities/payment-inbox-transfer.entity'
import { PaymentInboxTransferRepository } from './payment-inbox-transfer.repository'

@Module({
  imports: [TypeOrmModule.forFeature([PaymentInboxTransferEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [PaymentInboxTransferRepository],
  exports: [PaymentInboxTransferRepository],
})
export class PaymentInboxTransferRepositoryModule {}
