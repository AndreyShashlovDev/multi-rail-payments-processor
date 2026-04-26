import { AbstractInteractor } from '@app/types'
import { IntegrationAccountRepository } from '../../../data/repository/integration-account/integration-account.repository'
import { IntegrationAccountResult } from '../../../data/repository/custody/custody-repository.types'
import { Injectable } from '@nestjs/common'

export interface CreateIntegrationAccountParams {
  readonly account: IntegrationAccountResult
}

@Injectable()
export class CreateIntegrationAccountInteractor implements AbstractInteractor<
  CreateIntegrationAccountParams,
  Promise<void>
> {
  constructor(private readonly integrationAccountRepository: IntegrationAccountRepository) {}

  async execute(params: CreateIntegrationAccountParams): Promise<void> {
    await this.integrationAccountRepository.create({
      account: {
        ...params.account,
        custodyAccountId: params.account.id,
      },
    })
  }
}
