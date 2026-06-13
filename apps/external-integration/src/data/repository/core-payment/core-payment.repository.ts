import { Injectable } from '@nestjs/common'
import { CoreGrpcClient } from '../../data-source/grpc/core/core-grpc-client'
import { CreatePaymentParams } from './core-payment-repository.types'

@Injectable()
export class CorePaymentRepository {
  constructor(private readonly coreGrpcClient: CoreGrpcClient) {}

  async createPayment(params: CreatePaymentParams): Promise<void> {
    await this.coreGrpcClient.createPayment(params)
  }
}
