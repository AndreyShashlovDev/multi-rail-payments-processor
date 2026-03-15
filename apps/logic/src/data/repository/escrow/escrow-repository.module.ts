import { Module } from '@nestjs/common'
import { EscrowRepository } from './escrow.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogicPostgresConfig } from '../../data-source/postgres/logic-postgres.config'
import { EscrowEntity } from '../../data-source/postgres/entities/escrow.entity'

@Module({
  imports: [TypeOrmModule.forFeature([EscrowEntity], LogicPostgresConfig.DATASOURCE_NAME)],
  providers: [EscrowRepository],
  exports: [EscrowRepository],
})
export class EscrowRepositoryModule {}
