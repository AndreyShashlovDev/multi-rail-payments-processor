import { Controller, OnModuleDestroy } from '@nestjs/common'
import { CustodyRepository } from '../../../data/repository/custody/custody.repository'
import { Subscription } from 'rxjs'
import { IntegrationAccountResult } from '../../../data/repository/custody/custody-repository.types'
import { CreateIntegrationAccountInteractor } from '../../../application/interactor/create-integration-account/create-integration-account.interactor'

@Controller()
export class IntegrationAccountController implements OnModuleDestroy {
  private subscription: Subscription | null = null

  constructor(
    custodyRepository: CustodyRepository,
    private readonly createIntegrationAccountInteractor: CreateIntegrationAccountInteractor,
  ) {
    this.subscription = custodyRepository.onAccountsCreatedObservable(
      async (data) => await this.handleCreateNewAccounts(data),
    )
  }

  // todo move to listener (app layer)
  async handleCreateNewAccounts(data: IntegrationAccountResult): Promise<void> {
    await this.createIntegrationAccountInteractor.execute({ account: data })
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe()
  }
}
