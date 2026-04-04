import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'
import { PayoutIntentModel } from '../../../../payout-intent/model/payout-intent.model'
import { OperationTypeMapper } from '../../../../../shared/converter/operation-type.mapper'

export interface PlatformFeePayoutOperationParams {
  readonly payout: PayoutIntentModel
  readonly txId: Id
  readonly transferIds: ReadonlySet<Id>
}

export class PlatformFeePayoutOperation extends AbstractInteractor<
  PlatformFeePayoutOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: PlatformFeePayoutOperationParams): ReadonlyArray<BalanceChange> {
    const { payout, transferIds, txId } = params

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
            txId: txId,
            transferIds: Array.from(transferIds),
            reason: BalanceChangeReason.FEE,
            txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
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
            txId: txId,
            transferIds: Array.from(transferIds),
            reason: BalanceChangeReason.FEE,
            txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
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
            txId: txId,
            transferIds: Array.from(transferIds),
            reason: BalanceChangeReason.PLATFORM_FEE_CONSOLIDATION,
            txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
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
          txId: txId,
          transferIds: Array.from(transferIds),
          reason: BalanceChangeReason.FEE,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
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
          txId: txId,
          transferIds: Array.from(transferIds),
          reason: BalanceChangeReason.PLATFORM_FEE_CONSOLIDATION,
          txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
        },
      },
    ]
  }
}
