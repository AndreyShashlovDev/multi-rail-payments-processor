import { Module } from '@nestjs/common'
import { LedgerRepository } from './ledger.repository'
import { LedgerGrpcClientModule } from '../../data-source/grpc/ledger/ledger-grpc-client.module'

@Module({
  imports: [LedgerGrpcClientModule],
  providers: [LedgerRepository],
  exports: [LedgerRepository],
})
export class LedgerRepositoryModule {}
