import { Module } from '@nestjs/common'
import { InboxRepository } from './inbox.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { InboxEntity } from '../../data-source/postgres/entities/inbox.entity'

@Module({
  imports: [TypeOrmModule.forFeature([InboxEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [InboxRepository],
  exports: [InboxRepository],
})
export class InboxRepositoryModule {}
