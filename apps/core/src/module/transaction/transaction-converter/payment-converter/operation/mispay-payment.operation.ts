import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { Id, AbstractInteractor, UUID, IntegrationAccount } from '@app/types'
import { TransferModel } from '../../../model/transfer.model'
import { BalanceChangeType, IntegrationType } from '@app/shared'

export interface MispayPaymentOperationParams {
  readonly accountId: UUID | null
  readonly integration: IntegrationType
  readonly integrationAccount: IntegrationAccount | null
  readonly txId: Id
  readonly transfer: TransferModel
}

export class MispayPaymentOperation extends AbstractInteractor<
  MispayPaymentOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: MispayPaymentOperationParams): ReadonlyArray<BalanceChange> {
    const { accountId, integration, integrationAccount, txId, transfer } = params

    return [
      {
        type: BalanceChangeType.CREDIT,
        intentType: null,
        intentId: null,
        operationType: null,
        platformAccountId: accountId,
        integrationAccount,
        currency: transfer.currency,
        integration: integration,
        amount: transfer.amount,
        metadata: {
          txId: txId,
          transferIds: [transfer.id],
          reason: BalanceChangeReason.UNEXPECTED_PAYMENT,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
      {
        type: BalanceChangeType.HOLD,
        intentType: null,
        intentId: null,
        operationType: null,
        platformAccountId: accountId,
        integrationAccount,
        currency: transfer.currency,
        integration: integration,
        amount: transfer.amount,
        metadata: {
          txId: txId,
          transferIds: [transfer.id],
          reason: BalanceChangeReason.UNEXPECTED_PAYMENT,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
    ]
  }
}
