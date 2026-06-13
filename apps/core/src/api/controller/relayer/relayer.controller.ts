import { Controller } from '@nestjs/common'
import {
  RelayerController as GrpcRelayerController,
  RelayerControllerMethods,
} from '@app/shared/services/core/v1/grpc/generated/core'
import { GetRelayerAccountInteractor } from '../../../module/payout-intent/interactor/get-relayer-account/get-relayer-account.interactor'
import { RelayerResponse, GetRelayerQuery } from '@app/shared/services/core/v1/grpc/generated/relayer'
import { assertIntegrationType } from '@app/shared'
import { IntegrationAccount, IntegrationCurrency } from '@app/types'

@Controller()
@RelayerControllerMethods()
export class RelayerController implements GrpcRelayerController {
  constructor(private readonly getRelayerAccountInteractor: GetRelayerAccountInteractor) {}

  // todo: soft hold
  // When a relayer account is selected for a payout, its balance must be temporarily reserved
  // to prevent concurrent payouts from selecting the same account and overdrawing it.
  //
  // Expected flow:
  // 1. Find a relayer account with sufficient balance (current behavior)
  // 2. Place a soft hold on the relayer account balance in Core for the requested amount (additional internal table)
  //    (soft hold = reserve without actual debit, released when tx is confirmed or failed)
  // 3. Return the relayer account to the caller
  //
  // The soft hold must be released in two cases:
  // - tx CONFIRMED: hold converts to actual debit (funds moved on-chain)
  // - tx FAILED/CANCELED: hold is released, funds return to available balance
  //
  // Without soft hold, two concurrent payouts can select the same relayer account,
  // both see sufficient balance, and both attempt to send — resulting in insufficient funds on-chain.

  // Consider integration fees when selecting an account. - Currently not considered.
  async getRelayerAccount(request: GetRelayerQuery): Promise<RelayerResponse> {
    assertIntegrationType(request.toIntegration)
    assertIntegrationType(request.fromIntegration)

    const account = await this.getRelayerAccountInteractor.execute({
      fromIntegration: request.fromIntegration,
      fromAccount: request.fromAccount as IntegrationAccount,
      fromCurrency: request.fromCurrency as IntegrationCurrency,
      fromAmount: request.fromAmount,
      toIntegration: request.toIntegration,
      toAccount: request.toAccount as IntegrationAccount,
      toCurrency: request.toCurrency as IntegrationCurrency,
      toAmount: request.toAmount,
    })

    return {
      relayerAccount: account,
    }
  }
}
