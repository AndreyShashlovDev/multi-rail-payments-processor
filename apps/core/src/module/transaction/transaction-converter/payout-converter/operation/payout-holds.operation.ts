import { BalanceChange, BalanceChangeReason, BalanceChangeTxStatus } from '@app/shared/types/balance-change'
import { Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'
import { PayoutIntentModel } from '../../../../payout-intent/model/payout-intent.model'
import { OperationTypeMapper } from '../../../../../shared/converter/operation-type.mapper'

export interface PayoutHoldsOperationParams {
  readonly payout: PayoutIntentModel
  readonly txId: Id
  readonly transferIds: ReadonlySet<Id>
}

export class PayoutHoldsOperation extends AbstractInteractor<PayoutHoldsOperationParams, ReadonlyArray<BalanceChange>> {
  execute(params: PayoutHoldsOperationParams): ReadonlyArray<BalanceChange> {
    const { payout, transferIds, txId } = params

    const optionalHolds: BalanceChange[] = []
    const isInternalTransfer =
      payout.member.accountId === payout.from.account && payout.fromIntegration === IntegrationType.INTERNAL

    const amountIntegrationAccount = isInternalTransfer ? null : payout.from.account
    const platformFeeIntegrationAccount = isInternalTransfer ? null : payout.from.account
    const integrationFeeIntegrationAccount = isInternalTransfer ? null : payout.platformFeeAccount?.account

    const basicData: Pick<BalanceChange, 'intentType' | 'intentId' | 'operationType' | 'type'> = {
      type: BalanceChangeType.HOLD,
      intentType: IntentType.PAYOUT,
      intentId: payout.id,
      operationType: OperationTypeMapper.toBalanceChange(payout.operationType),
    }

    if (payout.platformFee && payout.platformFee.gt(0)) {
      optionalHolds.push({
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount: platformFeeIntegrationAccount,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.platformFee,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          reason: BalanceChangeReason.FEE,
          txStatus: BalanceChangeTxStatus.TX_PREPARED,
        },
      })
    }

    if (payout.integrationFee && payout.integrationFee.gt(0)) {
      const convertedIntegrationFee = payout.integrationFee.mul(payout.integrationFeeRate)
      const diff = payout.estimatedFee.minus(convertedIntegrationFee).div(payout.integrationFeeRate)

      optionalHolds.push({
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount: integrationFeeIntegrationAccount ?? null,
        currency: payout.estimatedFeeCurrency,
        integration: payout.fromIntegration,
        amount: payout.estimatedFee,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          reason: BalanceChangeReason.INTEGRATION_FEE,
          txStatus: BalanceChangeTxStatus.TX_PREPARED,
          integrationFeeDiff: diff,
        },
      })

      if (payout.integrationFeePayer) {
        optionalHolds.push({
          ...basicData,
          platformAccountId: payout.integrationFeePayer.platformAccountId ?? null,
          integrationAccount: isInternalTransfer ? null : payout.integrationFeePayer.account,
          currency: payout.integrationFeeCurrency,
          integration: payout.fromIntegration,
          amount: payout.integrationFee,
          metadata: {
            txId: txId,
            transferIds: Array.from(transferIds),
            reason: BalanceChangeReason.INTEGRATION_FEE,
            txStatus: BalanceChangeTxStatus.TX_PREPARED,
            integrationFeeDiff: diff,
          },
        })
      }
    }

    return [
      {
        ...basicData,
        platformAccountId: payout.member.accountId,
        integrationAccount: amountIntegrationAccount,
        currency: payout.fromCurrency,
        integration: payout.fromIntegration,
        amount: payout.fromAmount,
        metadata: {
          txId: txId,
          transferIds: Array.from(transferIds),
          reason: BalanceChangeReason.AMOUNT,
          txStatus: BalanceChangeTxStatus.TX_PREPARED,
        },
      },
      ...optionalHolds,
    ]
  }
}
