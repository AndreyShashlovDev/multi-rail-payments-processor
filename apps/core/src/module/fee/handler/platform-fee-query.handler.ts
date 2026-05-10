import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { IntegrationAccountLinkRepository } from '../../../data/repository/integration-account-link/integration-account-link.repository'
import { Injectable } from '@nestjs/common'
import { GetPlatformFeeQuery } from '@app/shared/services/fee/v1/cqrs/get-platform-fee.query'
import { GetPlatformFeeOperation } from '../operation/get-platform-fee.operation'

@Injectable()
@QueryHandler(GetPlatformFeeQuery)
export class PlatformFeeQueryHandler extends GetPlatformFeeOperation implements IQueryHandler<GetPlatformFeeQuery> {
  constructor(integrationAccountLinkRepository: IntegrationAccountLinkRepository) {
    super(integrationAccountLinkRepository)
  }
}
