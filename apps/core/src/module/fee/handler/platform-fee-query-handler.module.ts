import { Module } from '@nestjs/common'
import { IntegrationAccountLinkRepositoryModule } from '../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { PlatformFeeQueryHandler } from './platform-fee-query.handler'

@Module({
  imports: [IntegrationAccountLinkRepositoryModule],
  providers: [PlatformFeeQueryHandler],
})
export class PlatformFeeQueryHandlerModule {}
