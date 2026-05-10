import { Module } from '@nestjs/common'
import { CqrsDataSource } from './cqrs.data-source'

@Module({
  providers: [CqrsDataSource],
  exports: [CqrsDataSource],
})
export class CqrsDataSourceModule {}
