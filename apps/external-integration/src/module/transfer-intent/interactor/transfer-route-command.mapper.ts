import { ExecuteTransferRouteCommand } from '@app/shared/services/transfer-execution/v1'
import { TransferEventIntentData } from '@app/shared/services/external-integration/v1'
import { TransferRouteModel } from '../model/transfer-route.model'
import { TransferIntentModel } from '../model/transfer-intent.model'

export class TransferRouteCommandMapper {
  static toCommand(
    route: TransferRouteModel,
    transferIntent: Pick<TransferIntentModel, 'id' | 'intentType' | 'intentId'>,
  ): ExecuteTransferRouteCommand {
    return new ExecuteTransferRouteCommand(
      route.id,
      route.integration,
      route.executionType,
      route.initiator,
      route.fromAccount,
      route.toAccount,
      route.currency,
      route.rawAmount.toFixed(),
      new TransferEventIntentData(transferIntent.id, transferIntent.intentType, transferIntent.intentId),
    )
  }
}
