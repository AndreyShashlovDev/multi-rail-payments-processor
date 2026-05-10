import { Module } from '@nestjs/common'
import { CqrsDataSourceModule } from '../../data-source/cqrs/cqrs-data-source.module'
import { FeeRepository } from './fee.repository'

@Module({
  imports: [CqrsDataSourceModule],
  providers: [FeeRepository],
  exports: [FeeRepository],
})
export class FeeRepositoryModule {}
