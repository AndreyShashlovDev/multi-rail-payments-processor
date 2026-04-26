import { Module } from '@nestjs/common'
import { OutboxRepository } from './outbox.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'
import { OutboxEntity } from '../../data-source/postgres/entities/outbox.entity'

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity], IntegrationPostgresConfig.DATASOURCE_NAME)],
  providers: [OutboxRepository],
  exports: [OutboxRepository],
})
export class OutboxRepositoryModule {}
