import {
  PlatformFeeProvider,
  PlatformFeeProviderParams,
  PlatformFeeProviderResult,
} from '../../../shared/platform-fee/platform-fee.provider'
import { Injectable } from '@nestjs/common'
import {
  IntegrationAccountLinkRepository,
} from '../../../data/repository/integration-account-link/integration-account-link.repository'
import { PlatformFeeAccountNotFoundException } from '../exception/platform-fee-account-not-found.exception'
import { Numeric } from '@app/types'

@Injectable()
export class GetPlatformFeeDataOperation extends PlatformFeeProvider {
  constructor(private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository) {
    super()
  }

  // todo just for example. write real code!
  async execute(params: PlatformFeeProviderParams): Promise<PlatformFeeProviderResult> {
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
