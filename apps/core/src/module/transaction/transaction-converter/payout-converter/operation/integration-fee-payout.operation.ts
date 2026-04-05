import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PayoutBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { Id, AbstractInteractor, Numeric } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'
import { PayoutIntentModel } from '../../../../payout-intent/model/payout-intent.model'
import { OperationTypeMapper } from '../../../../../shared/converter/operation-type.mapper'
import { TransactionModel } from '../../../model/transaction.model'

export interface PlatformFeePayoutOperationParams {
  readonly payout: PayoutIntentModel
  readonly tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executedAt'>
  readonly transferIds: ReadonlySet<Id>
}

export class IntegrationFeePayoutOperation extends AbstractInteractor<
  PlatformFeePayoutOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: PlatformFeePayoutOperationParams): ReadonlyArray<BalanceChange> {
    const { payout, transferIds, tx } = params

    if (!payout.integrationFee || payout.integrationFee.lte(0) || !payout.integrationFeePayer) {
      return []
    }

    const convertedIntegrationFee = payout.integrationFee.mul(payout.integrationFeeRate)
    const diff = payout.estimatedFee.minus(convertedIntegrationFee).div(payout.integrationFeeRate)
    const userIntegrationFee = Numeric.min(convertedIntegrationFee, payout.estimatedFee)

    const isInternalTransfer =
      payout.member.accountId === payout.from.account && payout.fromIntegration === IntegrationType.INTERNAL

    const isUserPaysIntegrationFee = payout.integrationFeePayer.platformAccountId === payout.member.accountId

    const metadata: PayoutBalanceChangeMetadata = {
      txId: tx.id,
      sourceTxId: tx.sourceTxId,
      executedAt: tx.executedAt,
      transferIds: Array.from(transferIds),
      reason: BalanceChangeReason.INTEGRATION_FEE,
      txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
      integrationFeeDiff: diff,
    }

    const basicData: Pick<BalanceChange, 'intentType' | 'intentId' | 'operationType'> = {
      intentType: IntentType.PAYOUT,
      intentId: payout.id,
      operationType: OperationTypeMapper.toBalanceChange(payout.operationType),
    }

    if (isInternalTransfer) {
      return [
        {
          type: BalanceChangeType.RELEASE_HOLD,
          ...basicData,
          platformAccountId: payout.from.platformAccountId,
          integrationAccount: null,
          currency: payout.estimatedFeeCurrency,
          integration: payout.fromIntegration,
          amount: payout.estimatedFee,
          metadata,
        },
        {
          type: BalanceChangeType.PLATFORM_FEE_ACCRUED,
          ...basicData,
          platformAccountId: payout.from.platformAccountId,
          integrationAccount: null,
          currency: payout.integrationFeeCurrency,
          integration: payout.fromIntegration,
          amount: payout.integrationFee,
          metadata,
        },
      ]
    }

    if (isUserPaysIntegrationFee) {
      // User pays integration fee from their own wallet in the integration currency (e.g. ETH).
      // Release hold and debit the actual fee without limit — blockchain already validated funds.
      return [
        {
          type: BalanceChangeType.RELEASE_HOLD,
          ...basicData,
          platformAccountId: payout.integrationFeePayer.platformAccountId,
          integrationAccount: payout.integrationFeePayer.account,
          currency: payout.estimatedFeeCurrency,
          integration: payout.fromIntegration,
          amount: payout.estimatedFee,
          metadata,
        },
        {
          type: BalanceChangeType.DEBIT,
          ...basicData,
          platformAccountId: payout.integrationFeePayer.platformAccountId,
          integrationAccount: payout.integrationFeePayer.account,
          currency: payout.integrationFeeCurrency,
          integration: payout.fromIntegration,
          amount: payout.integrationFee,
          metadata,
        },
      ]
    }

    // Platform (hot wallet) or external payer covers the gas in integration currency (e.g. ETH).
    // User is charged in their own currency (e.g. USDT) up to the estimated fee — no overage.
    return [
      {
        type: BalanceChangeType.RELEASE_HOLD,
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount: payout.integrationFeePayer.account,
        currency: payout.estimatedFeeCurrency,
        integration: payout.fromIntegration,
        amount: payout.estimatedFee,
        metadata,
      },
      {
        type: BalanceChangeType.DEBIT,
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount: null,
        currency: payout.estimatedFeeCurrency,
        integration: payout.fromIntegration,
        amount: userIntegrationFee,
        metadata,
      },
      {
        type: BalanceChangeType.RELEASE_HOLD,
        ...basicData,
        platformAccountId: payout.integrationFeePayer.platformAccountId ?? null,
        integrationAccount: payout.integrationFeePayer.account,
        currency: payout.integrationFeeCurrency,
        integration: payout.fromIntegration,
        amount: payout.integrationFee,
        metadata,
      },
      {
        type: BalanceChangeType.DEBIT,
        ...basicData,
        platformAccountId: payout.integrationFeePayer.platformAccountId ?? null,
        integrationAccount: payout.integrationFeePayer.account,
        currency: payout.integrationFeeCurrency,
        integration: payout.fromIntegration,
        amount: payout.integrationFee,
        metadata,
      },
    ]
  }
}
