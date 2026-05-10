import { Module } from '@nestjs/common'
import { InternalBlockRepository } from './internal-block.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'
import { InternalBlockEntity } from '../../data-source/postgres/entities/internal-block.entity'

@Module({
  imports: [TypeOrmModule.forFeature([InternalBlockEntity], IntegrationPostgresConfig.DATASOURCE_NAME)],
  providers: [InternalBlockRepository],
  exports: [InternalBlockRepository],
})
export class InternalBlockRepositoryModule {}
