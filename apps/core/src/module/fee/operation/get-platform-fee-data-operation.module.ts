import { Module } from '@nestjs/common'
import { IntegrationAccountLinkRepositoryModule } from '../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { GetPlatformFeeOperation } from './get-platform-fee.operation'

@Module({
  imports: [IntegrationAccountLinkRepositoryModule],
  providers: [GetPlatformFeeOperation],
  exports: [GetPlatformFeeOperation],
})
export class GetPlatformFeeDataOperationModule {}
