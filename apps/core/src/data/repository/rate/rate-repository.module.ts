import { Module } from '@nestjs/common'
import { CqrsDataSourceModule } from '../../data-source/cqrs/cqrs-data-source.module'
import { RateRepository } from './rate.repository'

@Module({
  imports: [CqrsDataSourceModule],
  providers: [RateRepository],
  exports: [RateRepository],
})
export class RateRepositoryModule {}
