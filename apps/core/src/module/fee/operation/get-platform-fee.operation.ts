import { Injectable } from '@nestjs/common'
import { IntegrationAccountLinkRepository } from '../../../data/repository/integration-account-link/integration-account-link.repository'
import { PlatformFeeAccountNotFoundException } from '../exception/platform-fee-account-not-found.exception'
import { Numeric, IntegrationCurrency, AbstractInteractor } from '@app/types'
import { IntegrationAccountLinkModel } from '../../../shared/model/integration-account-link.model'
import { IntegrationType } from '@app/shared'

export interface GetPlatformFeeOperationParams {
  readonly integration: IntegrationType
  readonly currency: IntegrationCurrency
}

export interface PlatformFeeOperationResult {
  readonly platformFee: Numeric | null
  readonly platformFeeAccount: IntegrationAccountLinkModel | null
}

@Injectable()
export class GetPlatformFeeOperation extends AbstractInteractor<
  GetPlatformFeeOperationParams,
  Promise<PlatformFeeOperationResult>
> {
  constructor(private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository) {
    super()
  }

  // todo just for example. write real code!
  async execute(params: GetPlatformFeeOperationParams): Promise<PlatformFeeOperationResult> {
    const platformFeeAccount = await this.integrationAccountLinkRepository.getPlatformFeeAccount(params)

    if (!platformFeeAccount) {
      throw new PlatformFeeAccountNotFoundException()
    }

    return {
      platformFee: Numeric.create(0.1),
      platformFeeAccount,
    }
  }
}
