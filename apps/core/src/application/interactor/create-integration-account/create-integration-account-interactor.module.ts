import { Module } from '@nestjs/common'
import { IntegrationAccountRepositoryModule } from '../../../data/repository/integration-account/integration-account-repository.module'
import { CreateIntegrationAccountInteractor } from './create-integration-account.interactor'

@Module({
  imports: [IntegrationAccountRepositoryModule],
  providers: [CreateIntegrationAccountInteractor],
  exports: [CreateIntegrationAccountInteractor],
})
export class CreateIntegrationAccountInteractorModule {}
