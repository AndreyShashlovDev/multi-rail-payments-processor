import { Module } from '@nestjs/common'
import { InboxRepository } from './inbox.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogicPostgresConfig } from '../../data-source/postgres/logic-postgres.config'
import { InboxEntity } from '../../data-source/postgres/entities/inbox.entity'

@Module({
  imports: [TypeOrmModule.forFeature([InboxEntity], LogicPostgresConfig.DATASOURCE_NAME)],
  providers: [InboxRepository],
  exports: [InboxRepository],
})
export class InboxRepositoryModule {}
