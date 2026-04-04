import { Module } from '@nestjs/common'
import { AccountRepository } from './account.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { AccountEntity } from '../../data-source/postgres/entities/account.entity'

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [AccountRepository],
  exports: [AccountRepository],
})
export class AccountRepositoryModule {}
