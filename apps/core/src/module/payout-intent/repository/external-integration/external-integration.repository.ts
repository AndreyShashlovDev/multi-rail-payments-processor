import { IntegrationType } from '@app/shared'
import { Injectable } from '@nestjs/common'
import { Numeric, UUID } from '@app/types'
import { EstimateTransferFeeData, EstimateTransferFeeResult } from './external-integration.types'
import { randomUUID } from 'node:crypto'

@Injectable()
export class ExternalIntegrationRepository {
  constructor() {}

  async estimateTransferFee(param: EstimateTransferFeeData): Promise<EstimateTransferFeeResult> {
    // todo grpc request external integration service (make estimate for few minutes?)
    return {
      id: randomUUID(),
      integration: param.fromIntegration,
      amount: Numeric.create('0.2'),
      currency: 'native',
    }
  }

  /**
   * return pre-calculated transfer fee from {@link estimateTransferFee}
   * @param estimatedFeeId
   */
  async getEstimatedTransferFee(estimatedFeeId: UUID): Promise<EstimateTransferFeeResult> {
    // todo grpc request
    return {
      id: estimatedFeeId,
      integration: IntegrationType.ETHEREUM,
      amount: Numeric.create('0.2'),
      currency: 'native',
    }
  }
}
