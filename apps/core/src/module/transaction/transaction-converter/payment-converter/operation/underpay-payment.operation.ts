import {
  BalanceChange,
  BalanceChangeReason,
  BalanceChangeTxStatus,
  PaymentBalanceChangeMetadata,
} from '@app/shared/types/balance-change'
import { PaymentIntentModel } from '../../../../payment-intent/model/payment-intent.model'
import { Numeric, Id, AbstractInteractor } from '@app/types'
import { IntentType, BalanceChangeType, IntegrationType } from '@app/shared'
import { OperationTypeMapper } from '../../../../../shared/converter/operation-type.mapper'
import { TransactionModel } from '../../../model/transaction.model'

export interface UnderpayPaymentOperationParams {
  readonly payment: PaymentIntentModel
  readonly tx: Pick<TransactionModel, 'id' | 'sourceTxId' | 'executedAt'>
  readonly transferIds: ReadonlySet<Id>
  readonly amount: Numeric
  readonly expectedAmount: Numeric
}

export class UnderpayPaymentOperation extends AbstractInteractor<
  UnderpayPaymentOperationParams,
  ReadonlyArray<BalanceChange>
> {
  execute(params: UnderpayPaymentOperationParams): ReadonlyArray<BalanceChange> {
    const { payment, amount, expectedAmount, transferIds, tx } = params

    const isInternalTransfer =
      payment.to.account === payment.member.accountId && payment.integration === IntegrationType.INTERNAL

    const integrationAccount = isInternalTransfer ? null : payment.to.account
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
      actualAmount: amount,
      expectedAmount,
      txStatus: BalanceChangeTxStatus.TX_CONFIRMED,
    }

    return [
      {
        type: BalanceChangeType.CREDIT,
        ...basicData,
        platformAccountId: payment.to.platformAccountId,
        integrationAccount,
        currency: payment.currency,
        integration: payment.integration,
        amount: amount,
        metadata: {
          ...basicMetadata,
          reason: BalanceChangeReason.UNDERPAY,
        },
      },
      {
        type: BalanceChangeType.HOLD,
        ...basicData,
        platformAccountId: payment.to.platformAccountId,
        integrationAccount,
        currency: payment.currency,
        integration: payment.integration,
        amount: amount,
        metadata: {
          ...basicMetadata,
          reason: BalanceChangeReason.UNDERPAY,
        },
      },
    ]
  }
}
