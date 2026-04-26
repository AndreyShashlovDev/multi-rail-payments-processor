import { Module } from '@nestjs/common'
import { InboxRepository } from './inbox.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InboxEntity } from '../../data-source/postgres/entities/inbox.entity'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'

@Module({
  imports: [TypeOrmModule.forFeature([InboxEntity], IntegrationPostgresConfig.DATASOURCE_NAME)],
  providers: [InboxRepository],
  exports: [InboxRepository],
})
export class InboxRepositoryModule {}
