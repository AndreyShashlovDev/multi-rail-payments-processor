import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PaymentBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { AbstractInteractor, UUID, IntegrationAccount } from '@app/types'
import { BalanceChangeType, IntegrationType } from '@app/shared'
import { TransactionModel } from '../../../../../shared/model/transaction.model'
import { TransferModel } from '../../../../../shared/model/transfer.model'

export interface MispayPaymentOperationParams {
  readonly accountId: UUID | null
  readonly integration: IntegrationType
  readonly integrationAccount: IntegrationAccount | null
  readonly tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executedAt'>
  readonly transfer: TransferModel
}

export class MispayPaymentOperation extends AbstractInteractor<
  MispayPaymentOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: MispayPaymentOperationParams): ReadonlyArray<BalanceChange> {
    const { accountId, integration, integrationAccount, tx, transfer } = params

    const basicMetadata: Omit<PaymentBalanceChangeMetadata, 'reason'> = {
      txId: tx.id,
      sourceTxId: tx.sourceTxId,
      executedAt: tx.executedAt,
      transferIds: [transfer.id],
      txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
    }

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
          ...basicMetadata,
          reason: BalanceChangeReason.UNEXPECTED_PAYMENT,
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
          ...basicMetadata,
          reason: BalanceChangeReason.UNEXPECTED_PAYMENT,
        },
      },
    ]
  }
}
