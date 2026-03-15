import { Module } from '@nestjs/common'
import { AccountRepository } from './account.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogicPostgresConfig } from '../../data-source/postgres/logic-postgres.config'
import { AccountEntity } from '../../data-source/postgres/entities/account.entity'

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity], LogicPostgresConfig.DATASOURCE_NAME)],
  providers: [AccountRepository],
  exports: [AccountRepository],
})
export class AccountRepositoryModule {}
