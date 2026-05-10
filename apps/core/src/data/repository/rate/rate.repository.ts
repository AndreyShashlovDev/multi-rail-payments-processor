import { CqrsDataSource } from '../../data-source/cqrs/cqrs.data-source'
import { GetConversionRateParams, ConversionRateResult } from './rate-repository.types'
import { GetConversionRateQuery } from '@app/shared/services/rate/v1/cqrs/get-conversion-rate.query'
import { Injectable } from '@nestjs/common'

@Injectable()
export class RateRepository {
  constructor(private readonly cqrs: CqrsDataSource) {}

  async getConversionRate(params: GetConversionRateParams): Promise<ConversionRateResult> {
    return await this.cqrs.makeQuery(new GetConversionRateQuery(params.from, params.to))
  }
}
