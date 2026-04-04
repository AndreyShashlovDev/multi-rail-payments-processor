import { Module } from '@nestjs/common'
import { CustodyRepository } from './custody.repository'

@Module({
  providers: [CustodyRepository],
  exports: [CustodyRepository],
})
export class CustodyRepositoryModule {}
