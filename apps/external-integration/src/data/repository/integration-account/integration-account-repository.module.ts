import { Module } from '@nestjs/common'
import { IntegrationAccountRepository } from './integration-account.repository'

@Module({
  providers: [IntegrationAccountRepository],
  exports: [IntegrationAccountRepository],
})
export class IntegrationAccountRepositoryModule {}
