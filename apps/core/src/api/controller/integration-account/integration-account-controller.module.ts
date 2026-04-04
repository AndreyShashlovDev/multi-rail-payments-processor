import { Module } from '@nestjs/common'
import { IntegrationAccountController } from './integration-account.controller'
import {
  CreateIntegrationAccountInteractorModule,
} from '../../../application/interactor/create-integration-account/create-integration-account-interactor.module'
import { CustodyRepositoryModule } from '../../../data/repository/custody/custody-repository.module'

@Module({
  imports: [CreateIntegrationAccountInteractorModule, CustodyRepositoryModule],
  controllers: [IntegrationAccountController],
})
export class IntegrationAccountControllerModule {}
