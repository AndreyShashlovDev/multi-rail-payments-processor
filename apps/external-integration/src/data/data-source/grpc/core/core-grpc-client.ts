import { Injectable, Inject } from '@nestjs/common'
import { type ClientGrpc } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'
import {
  INTEGRATION_ACCOUNT_SERVICE_NAME,
  IntegrationAccountClient,
  RelayerClient,
  RELAYER_SERVICE_NAME,
  PaymentClient,
  PAYMENT_SERVICE_NAME,
} from '@app/shared/services/core/v1/grpc/generated/core'
import { HasAccountQuery, HasAccountResponse } from '@app/shared/services/core/v1/grpc/generated/integration-account'
import { RelayerResponse, GetRelayerQuery } from '@app/shared/services/core/v1/grpc/generated/relayer'
import { GRPC_CORE_CLIENT } from './grpc-core-client.type'
import { CreatePaymentQuery, CreatePaymentResponse } from '@app/shared/services/core/v1/grpc/generated/payment'

@Injectable()
export class CoreGrpcClient {
  private readonly relayerServiceClient: RelayerClient
  private readonly integrationAccountClient: IntegrationAccountClient
  private readonly paymentClient: PaymentClient

  constructor(@Inject(GRPC_CORE_CLIENT) client: ClientGrpc) {
    this.relayerServiceClient = client.getService<RelayerClient>(RELAYER_SERVICE_NAME)
    this.integrationAccountClient = client.getService<IntegrationAccountClient>(INTEGRATION_ACCOUNT_SERVICE_NAME)
    this.paymentClient = client.getService<PaymentClient>(PAYMENT_SERVICE_NAME)
  }

  async getRelayerAccount(request: GetRelayerQuery): Promise<RelayerResponse> {
    return firstValueFrom(this.relayerServiceClient.getRelayerAccount(request))
  }

  async createPayment(request: CreatePaymentQuery): Promise<CreatePaymentResponse> {
    return firstValueFrom(this.paymentClient.createPayment(request))
  }

  async hasIntegrationAccount(request: HasAccountQuery): Promise<HasAccountResponse> {
    return firstValueFrom(this.integrationAccountClient.hasAccount(request))
  }
}
