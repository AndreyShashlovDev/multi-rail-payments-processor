import { Controller, OnModuleDestroy } from '@nestjs/common'
import { CustodyRepository } from '../../../data/repository/custody/custody.repository'
import { Subscription } from 'rxjs'
import { IntegrationAccountResult } from '../../../data/repository/custody/custody-repository.types'
import { CreateIntegrationAccountInteractor } from '../../../application/interactor/create-integration-account/create-integration-account.interactor'
import {
  IntegrationAccountControllerMethods,
  IntegrationAccountController as GrpcIntegrationAccountController,
} from '@app/shared/services/core/v1/grpc/generated/core'
import { HasAccountQuery, HasAccountResponse } from '@app/shared/services/core/v1/grpc/generated/integration-account'
import { IntegrationAccountRepository } from '../../../data/repository/integration-account/integration-account.repository'
import { IntegrationAccount } from '@app/types'

@Controller()
@IntegrationAccountControllerMethods()
export class IntegrationAccountController implements GrpcIntegrationAccountController, OnModuleDestroy {
  private subscription: Subscription | null = null

  constructor(
    custodyRepository: CustodyRepository,
    private readonly integrationAccountRepository: IntegrationAccountRepository,
    private readonly createIntegrationAccountInteractor: CreateIntegrationAccountInteractor,
  ) {
    this.subscription = custodyRepository.onAccountsCreatedObservable(
      async (data) => await this.handleCreateNewAccounts(data),
    )
  }

  async hasAccount(request: HasAccountQuery): Promise<HasAccountResponse> {
    const result = await this.integrationAccountRepository.hasAccounts({
      accounts: new Set(request.account as IntegrationAccount[]),
    })

    return {
      existing: Array.from(result.existing),
    }
  }

  // todo move to listener (app layer)
  async handleCreateNewAccounts(data: IntegrationAccountResult): Promise<void> {
    await this.createIntegrationAccountInteractor.execute({ account: data })
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe()
  }
}
