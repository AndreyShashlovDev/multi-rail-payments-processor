import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PaymentBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { PaymentIntentModel, PaymentPlatformFeePayerType } from '../../../model/payment-intent.model'
import { Numeric, Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, ExecutionType } from '@app/shared'
import { OperationTypeMapper } from '../../../../../shared/projection/operation-type.mapper'
import { TransactionModel } from '../../../../../shared/model/transaction.model'
import { PaymentFeeCalculate } from '../payment-fee-calculate'
import { IntegrationCurrencyModel } from '../../../../../shared/model/integration-currency.model'

export interface FeePaymentOperationParams {
  readonly payment: PaymentIntentModel
  readonly tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executionType' | 'executedAt'>
  readonly transferIds: ReadonlySet<Id>
  readonly transferAmount: Numeric
  readonly accumulatedAmount: Numeric
  readonly feeCurrency: IntegrationCurrencyModel
}

export interface FeePaymentOperationResult {
  readonly amount: Numeric
  readonly payerFeeAmount: Numeric
  readonly clientFeeAmount: Numeric
  readonly changes: ReadonlyArray<BalanceChange>
}

export class FeePaymentOperation extends AbstractInteractor<FeePaymentOperationParams, FeePaymentOperationResult> {
  execute(params: FeePaymentOperationParams): FeePaymentOperationResult {
    const { payment, transferAmount, accumulatedAmount, transferIds, tx, feeCurrency } = params
    if (
      !payment.platformFee ||
      payment.platformFee.lte(Numeric.ZERO) ||
      !payment.platformFeePayer ||
      !payment.platformFeeAccount
    ) {
      return { amount: transferAmount, clientFeeAmount: Numeric.ZERO, payerFeeAmount: Numeric.ZERO, changes: [] }
    }

    const partialFee = PaymentFeeCalculate(payment, transferAmount, accumulatedAmount, feeCurrency.minorUnit)

    const isPayerFeePayed = payment.platformFeePayer === PaymentPlatformFeePayerType.PAYER
    const amount = transferAmount.minus(partialFee)
    const payerFeeAmount = isPayerFeePayed ? payment.platformFee : Numeric.ZERO
    const clientFeeAmount = isPayerFeePayed ? Numeric.ZERO : payment.platformFee

    const isInternalTransfer = tx.executionType === ExecutionType.INTERNAL

    const basicData: Pick<BalanceChange, 'intentType' | 'intentId' | 'operationType'> = {
      intentType: IntentType.PAYMENT,
      intentId: payment.id,
      operationType: OperationTypeMapper.toBalanceChange(payment.operationType),
    }

    const basicMetadata: Omit<PaymentBalanceChangeMetadata, 'reason'> = {
      txId: tx.id,
      sourceTxId: tx.sourceTxId,
      executedAt: tx.executedAt,
      transferIds: Array.from(transferIds),
      txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
      executionType: tx.executionType,
    }

    const changes: BalanceChange[] = []

    if (isInternalTransfer) {
      changes.push(
        {
          type: BalanceChangeType.DEBIT,
          ...basicData,
          platformAccountId: payment.to.platformAccountId,
          integrationAccount: null,
          currency: payment.currency,
          integration: payment.integration,
          amount: partialFee,
          metadata: {
            ...basicMetadata,
            reason: BalanceChangeReason.FEE,
          },
        },
        {
          type: BalanceChangeType.CREDIT,
          ...basicData,
          platformAccountId: payment.platformFeeAccount.platformAccountId,
          integrationAccount: null,
          currency: payment.currency,
          integration: payment.integration,
          amount: partialFee,
          metadata: {
            ...basicMetadata,
            reason: BalanceChangeReason.PLATFORM_FEE_CONSOLIDATION,
          },
        },
      )
    } else {
      changes.push(
        {
          type: BalanceChangeType.PLATFORM_FEE_ACCRUED,
          ...basicData,
          platformAccountId: null,
          integrationAccount: payment.to.account,
          currency: payment.currency,
          integration: payment.integration,
          amount: partialFee,
          metadata: {
            ...basicMetadata,
            reason: BalanceChangeReason.PLATFORM_FEE_CONSOLIDATION,
          },
        },
        {
          type: BalanceChangeType.DEBIT,
          ...basicData,
          platformAccountId: payment.to.platformAccountId,
          integrationAccount: null,
          currency: payment.currency,
          integration: payment.integration,
          amount: partialFee,
          metadata: {
            ...basicMetadata,
            reason: BalanceChangeReason.FEE,
          },
        },
      )
    }

    return {
      amount,
      payerFeeAmount,
      clientFeeAmount,
      changes,
    }
  }
}
