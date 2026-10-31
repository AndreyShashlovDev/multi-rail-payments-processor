import { Module } from '@nestjs/common'
import { ExternalIntegrationRepository } from './external-integration.repository'

@Module({
  imports: [],
  providers: [ExternalIntegrationRepository],
  exports: [ExternalIntegrationRepository],
})
export class ExternalIntegrationRepositoryModule {}
