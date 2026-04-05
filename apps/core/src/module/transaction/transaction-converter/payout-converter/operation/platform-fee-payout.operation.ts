import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PayoutBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'
import { PayoutIntentModel } from '../../../../payout-intent/model/payout-intent.model'
import { OperationTypeMapper } from '../../../../../shared/converter/operation-type.mapper'
import { TransactionModel } from '../../../model/transaction.model'

export interface PlatformFeePayoutOperationParams {
  readonly payout: PayoutIntentModel
  readonly tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executedAt'>
  readonly transferIds: ReadonlySet<Id>
}

export class PlatformFeePayoutOperation extends AbstractInteractor<
  PlatformFeePayoutOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: PlatformFeePayoutOperationParams): ReadonlyArray<BalanceChange> {
    const { payout, transferIds, tx } = params

    if (!payout.platformFee || !payout.platformFeeAccount) {
      return []
    }

    const isInternalTransfer =
      payout.member.accountId === payout.from.account && payout.fromIntegration === IntegrationType.INTERNAL

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
    }

    if (!isInternalTransfer) {
      const integrationAccount = payout.from.account

      return [
        {
          type: BalanceChangeType.RELEASE_HOLD,
          ...basicData,
          platformAccountId: payout.member.accountId,
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
          platformAccountId: payout.member.accountId,
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
          type: BalanceChangeType.PLATFORM_FEE_ACCRUED,
          ...basicData,
          platformAccountId: null,
          integrationAccount,
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
        platformAccountId: payout.member.accountId,
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
        type: BalanceChangeType.PLATFORM_FEE_ACCRUED,
        ...basicData,
        platformAccountId: payout.member.accountId,
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
