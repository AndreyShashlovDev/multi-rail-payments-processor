import { Module } from '@nestjs/common'
import { EscrowRepository } from './escrow.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { EscrowEntity } from '../../data-source/postgres/entities/escrow.entity'

@Module({
  imports: [TypeOrmModule.forFeature([EscrowEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [EscrowRepository],
  exports: [EscrowRepository],
})
export class EscrowRepositoryModule {}
