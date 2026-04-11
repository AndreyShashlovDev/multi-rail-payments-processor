import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { PayoutInboxTransferRepository } from './payout-inbox-transfer.repository'
import { PayoutInboxTransferEntity } from '../../data-source/postgres/entities/payout-inbox-transfer.entity'

@Module({
  imports: [TypeOrmModule.forFeature([PayoutInboxTransferEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [PayoutInboxTransferRepository],
  exports: [PayoutInboxTransferRepository],
})
export class PayoutInboxTransferRepositoryModule {}
