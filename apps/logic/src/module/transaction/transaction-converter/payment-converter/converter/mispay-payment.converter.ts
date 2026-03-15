import { Id } from '@app/types'
import { MispayPaymentOperation } from '../operation/mispay-payment.operation'
import { PaymentPriority, PaymentConverterPriority } from '../../converter-priority.constants'
import { BasicPaymentConverter } from '../basic-payment-converter'
import { MispaymentInvalidStateException } from '../../../exception/mispayment-Invalid-state.exception'
import { PaymentTransactionContext } from '../payment-transaction.converter'
import { TransactionConverterResult } from '../../basic-transaction.converter'
import { HoldInPaymentOperation } from '../operation/hold-in-payment.operation'
import { TransactionStatus } from '@app/shared'
import { BalanceChangeTxStatus, BalanceChangeReason } from '@app/shared/types/balance-change'
import { LinkModelType } from '../../../../../shared/model/integration-account-link.model'

export class MispayPaymentConverter extends BasicPaymentConverter {
  readonly name: string = 'MispayPaymentConverter'
  readonly priority: PaymentPriority = PaymentConverterPriority.MISPAY

  constructor(
    private readonly mispayOperation: MispayPaymentOperation,
    private readonly holdInOperation: HoldInPaymentOperation,
  ) {
    super()
  }

  execute(params: PaymentTransactionContext): TransactionConverterResult<PaymentTransactionContext> {
    const usedTransfers = new Set<Id>()
    const { payments, transfers } = this.preparePaymentsAndTransfers(params)

    const transfersCurrency = new Set(params.transfers.map((transfer) => transfer.currency))
    const checkByCurrency = payments.find((payment) => transfersCurrency.has(payment.currency))

    if (checkByCurrency) {
      // this shouldn't happen, because it would either go through exact/sequential/overpay/underpay/
      // or we've already processed all the payments
      throw new MispaymentInvalidStateException(checkByCurrency.id)
    }

    const changes = transfers
      .filter((transfer) => params.integrationAccounts.get(transfer.to))
      .flatMap((transfer) => {
        const link = params.accountsLink.get(transfer.to)
        const platformAccount = params.platformAccounts.get(transfer.to)
        const integrationAccount = platformAccount
          ? null
          : (params.integrationAccounts.get(transfer.to)?.account ?? transfer.to)

        let platformAccountId = link?.platformAccountId ?? platformAccount?.id ?? null

        if (!platformAccount && link?.linkType === LinkModelType.TEMPORAL) {
          platformAccountId = null
        }

        if (!platformAccountId && !integrationAccount) {
          return []
        }

        usedTransfers.add(transfer.id)

        const holdIn = this.holdInOperation.execute({
          integration: params.transaction.integration,
          platformAccountId,
          integrationAccount,
          amount: transfer.amount,
          currency: transfer.currency,
          txId: params.transaction.id,
          transferIds: new Set([transfer.id]),
          action: params.transaction.status === TransactionStatus.ACCEPTED ? 'hold' : 'release',
          reason: BalanceChangeReason.UNEXPECTED_PAYMENT,
          txStatus:
            params.transaction.status === TransactionStatus.ACCEPTED
              ? BalanceChangeTxStatus.TX_ACCEPTED
              : BalanceChangeTxStatus.TX_CONFIRMED,
        })

        if (params.transaction.status === TransactionStatus.ACCEPTED) {
          return [...holdIn]
        }

        const mispay = this.mispayOperation.execute({
          accountId: link?.platformAccountId ?? null,
          integration: params.transaction.integration,
          integrationAccount,
          txId: params.transaction.id,
          transfer,
        })

        return [...holdIn, ...mispay]
      })

    const notUserTransfers = params.transfers.filter((transfer) => !usedTransfers.has(transfer.id))

    return {
      context: {
        ...params,
        transfers: notUserTransfers,
      },
      changes,
    }
  }
}
