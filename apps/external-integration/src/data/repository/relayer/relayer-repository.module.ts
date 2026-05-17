import { Module } from '@nestjs/common'
import { CoreGrpcClientModule } from '../../data-source/grpc/core/core-grpc-client.module'
import { RelayerRepository } from './relayer.repository'

@Module({
  imports: [CoreGrpcClientModule],
  providers: [RelayerRepository],
  exports: [RelayerRepository],
})
export class RelayerRepositoryModule {}
