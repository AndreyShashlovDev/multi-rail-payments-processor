import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PayoutBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { Id, AbstractInteractor, UUID, IntegrationAccount } from '@app/types'
import { IntentType, BalanceChangeType, ExecutionType } from '@app/shared'
import { PayoutIntentModel } from '../../../model/payout-intent.model'
import { OperationTypeMapper } from '../../../../../shared/projection/operation-type.mapper'
import { TransactionModel } from '../../../../../shared/model/transaction.model'

export interface PlatformFeePayoutOperationParams {
  readonly payout: PayoutIntentModel
  readonly tx: Omit<TransactionModel, 'transfers'>
  readonly transferIds: ReadonlySet<Id>
  readonly from: { platformAccountId: UUID | null; integrationAccount: IntegrationAccount | null }
}

export class PlatformFeePayoutOperation extends AbstractInteractor<
  PlatformFeePayoutOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: PlatformFeePayoutOperationParams): ReadonlyArray<BalanceChange> {
    const { payout, tx, transferIds, from } = params

    if (!payout.platformFee || !payout.platformFeeAccount) {
      return []
    }

    if (from.platformAccountId !== payout.member.accountId) {
      return []
    }

    const isInternalTransfer = tx.executionType === ExecutionType.INTERNAL

    const basicData: Pick<BalanceChange, 'intentType' | 'intentId' | 'operationType'> = {
      intentType: IntentType.PAYOUT,
      intentId: payout.id,
      operationType: OperationTypeMapper.toBalanceChange(payout.operationType),
    }

    const basicMetadata: Omit<PayoutBalanceChangeMetadata, 'reason'> = {
      txId: tx.id,
      sourceTxId: tx.sourceTxId,
      executedAt: tx.executedAt,
      transferIds: Array.from(transferIds),
      txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
      executionType: tx.executionType,
    }

    const { platformAccountId, integrationAccount } = from

    if (!isInternalTransfer) {
      return [
        {
          type: BalanceChangeType.RELEASE_HOLD,
          ...basicData,
          platformAccountId,
          integrationAccount,
          currency: payout.fromCurrency,
          integration: payout.fromIntegration,
          amount: payout.platformFee,
          metadata: {
            ...basicMetadata,
            reason: BalanceChangeReason.FEE,
          },
        },
        {
          type: BalanceChangeType.DEBIT,
          ...basicData,
          platformAccountId,
          integrationAccount: null,
          currency: payout.fromCurrency,
          integration: payout.fromIntegration,
          amount: payout.platformFee,
          metadata: {
            ...basicMetadata,
            reason: BalanceChangeReason.FEE,
          },
        },
        {
          type: BalanceChangeType.CREDIT,
          ...basicData,
          platformAccountId: payout.platformFeeAccount.platformAccountId ?? platformAccountId,
          integrationAccount: null,
          currency: payout.fromCurrency,
          integration: payout.fromIntegration,
          amount: payout.platformFee,
          metadata: {
            ...basicMetadata,
            reason: BalanceChangeReason.PLATFORM_FEE_CONSOLIDATION,
          },
        },
      ]
    }

    // internal transfer
    return [
      {
        type: BalanceChangeType.RELEASE_HOLD,
        ...basicData,
        platformAccountId,
        integrationAccount: null,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.platformFee,
        metadata: {
          ...basicMetadata,
          reason: BalanceChangeReason.FEE,
        },
      },
      {
        type: BalanceChangeType.DEBIT,
        ...basicData,
        platformAccountId,
        integrationAccount: null,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.platformFee,
        metadata: {
          ...basicMetadata,
          reason: BalanceChangeReason.FEE,
        },
      },
      {
        type: BalanceChangeType.CREDIT,
        ...basicData,
        platformAccountId: payout.platformFeeAccount.platformAccountId ?? platformAccountId,
        integrationAccount: null,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.platformFee,
        metadata: {
          ...basicMetadata,
          reason: BalanceChangeReason.PLATFORM_FEE_CONSOLIDATION,
        },
      },
    ]
  }
}
