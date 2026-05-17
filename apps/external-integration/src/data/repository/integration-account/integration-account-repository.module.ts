import { Module } from '@nestjs/common'
import { IntegrationAccountRepository } from './integration-account.repository'
import { CoreGrpcClientModule } from '../../data-source/grpc/core/core-grpc-client.module'

@Module({
  imports: [CoreGrpcClientModule],
  providers: [IntegrationAccountRepository],
  exports: [IntegrationAccountRepository],
})
export class IntegrationAccountRepositoryModule {}
