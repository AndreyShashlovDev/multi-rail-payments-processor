import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { ReceiptRepository } from './receipt.repository'
import { ReceiptEntity } from '../../data-source/postgres/entities/receipt.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ReceiptEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [ReceiptRepository],
  exports: [ReceiptRepository],
})
export class ReceiptRepositoryModule {}
