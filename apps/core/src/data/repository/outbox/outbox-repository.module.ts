import { Module } from '@nestjs/common'
import { OutboxRepository } from './outbox.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OutboxEntity } from '../../data-source/postgres/entities/outbox.entity'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity], CorePostgresConfig.DATASOURCE_NAME)],
  providers: [OutboxRepository],
  exports: [OutboxRepository],
})
export class OutboxRepositoryModule {}
