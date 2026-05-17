import { Controller } from '@nestjs/common'
import {
  RelayerController as GrpcRelayerController,
  RelayerControllerMethods,
} from '@app/shared/services/core/v1/grpc/generated/core'
import { GetRelayerAccountInteractor } from '../../../module/payout-intent/interactor/get-relayer-account/get-relayer-account.interactor'
import { IntegrationType } from '@app/shared'
import { IntegrationCurrency } from '@app/types'
import { RelayerResponse, GetRelayerQuery } from '@app/shared/services/core/v1/grpc/generated/relayer'

@Controller()
@RelayerControllerMethods()
export class RelayerController implements GrpcRelayerController {
  constructor(private readonly getRelayerAccountInteractor: GetRelayerAccountInteractor) {}

  async getRelayerAccount(request: GetRelayerQuery): Promise<RelayerResponse> {
    const account = await this.getRelayerAccountInteractor.execute({
      integration: request.integration as IntegrationType,
      currency: request.currency as IntegrationCurrency,
      amount: request.amount,
    })

    return {
      relayerAccount: account,
    }
  }
}
