import { Module } from '@nestjs/common'
import { LedgerRepository } from './ledger.repository'
import { LedgerGrpcClientModule } from '../../data-source/grpc/ledger/ledger-grpc-client.module'
import {
  LedgerJetstreamDataSourceModule,
} from '../../data-source/nats-jetstream/ledger/ledger-jetstream-data-source.module'

@Module({
  imports: [LedgerGrpcClientModule, LedgerJetstreamDataSourceModule],
  providers: [LedgerRepository],
  exports: [LedgerRepository],
})
export class LedgerRepositoryModule {}
