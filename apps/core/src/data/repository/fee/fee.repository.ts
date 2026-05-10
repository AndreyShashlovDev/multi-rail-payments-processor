import { Injectable } from '@nestjs/common'
import { CqrsDataSource } from '../../data-source/cqrs/cqrs.data-source'
import { GetPlatformFeeParams, PlatformFeeResult } from './fee-repository.types'
import { GetPlatformFeeQuery } from '@app/shared/services/fee/v1/cqrs/get-platform-fee.query'

@Injectable()
export class FeeRepository {
  constructor(private readonly cqrsDataSource: CqrsDataSource) {}

  async getPlatformFee(params: GetPlatformFeeParams): Promise<PlatformFeeResult> {
    return await this.cqrsDataSource.makeQuery(new GetPlatformFeeQuery(params.integration, params.currency))
  }
}
