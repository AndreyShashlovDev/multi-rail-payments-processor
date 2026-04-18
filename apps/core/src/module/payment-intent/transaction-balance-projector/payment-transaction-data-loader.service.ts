import { PaymentIntentRepository } from '../../../data/repository/payment-intent/payment-intent.repository'
import { UUID, IntegrationCurrency, Id } from '@app/types'
import { IntegrationAccountLinkModel } from '../../../shared/model/integration-account-link.model'
import { PaymentIntentModel, PaymentIntentStatus } from '../model/payment-intent.model'
import { IntegrationAccount } from '@app/types/integration-account'
import { Injectable } from '@nestjs/common'
import { IntegrationAccountLinkRepository } from '../../../data/repository/integration-account-link/integration-account-link.repository'
import { IntegrationAccountRepository } from '../../../data/repository/integration-account/integration-account.repository'
import { IntegrationType } from '@app/shared'
import { IntegrationAccountModel } from '../../../shared/model/integration-account.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { AccountRepository } from '../../../data/repository/account/account.repository'
import { AccountModel } from '../../../shared/model/account.model'
import { isUUID } from 'class-validator'
import { TransactionModel } from '../../../shared/model/transaction.model'
import { TransferModel } from '../../../shared/model/transfer.model'
import { PaymentAmountAccumulatorModel } from '../model/payment-amount-accumulator.model'
import { PaymentAmountAccumulatorRepository } from '../../../data/repository/payment-amount-accumulator/payment-amount-accumulator.repository'
import { IntegrationCurrencyModel } from '../../../shared/model/integration-currency.model'
import { CurrencyRepository } from '../../../data/repository/currency/currency.repository'

export interface TransactionDataResult {
  readonly integrationAccounts: ReadonlyMap<IntegrationAccount, IntegrationAccountModel>
  readonly accountsLink: ReadonlyMap<IntegrationAccount, IntegrationAccountLinkModel>
  readonly payments: ReadonlyArray<PaymentIntentModel>
  readonly accountsForPayment: ReadonlyMap<IntegrationAccount, AccountModel>
  readonly actualTransfers: ReadonlyArray<TransferModel>
  readonly amounts: ReadonlyMap<UUID, ReadonlyArray<PaymentAmountAccumulatorModel>>
  readonly currencies: ReadonlyMap<IntegrationCurrency, IntegrationCurrencyModel>
}

export interface LookupData {
  readonly transaction: TransactionModel
  readonly paymentConfig: { status: ReadonlySet<PaymentIntentStatus> }
}

@Injectable()
export class PaymentTransactionDataLoader {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountLinkRepository: IntegrationAccountLinkRepository,
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly integrationAccountRepository: IntegrationAccountRepository,
    private readonly paymentAmountAccumulatorRepository: PaymentAmountAccumulatorRepository,
    private readonly currencyRepository: CurrencyRepository,
  ) {}

  async getLookupData(data: LookupData, ctx: TxContext): Promise<TransactionDataResult> {
    const { transaction, paymentConfig } = data

    const integrationAccounts = await this.loadIntegrationAccounts(transaction.integration, transaction.transfers, ctx)
    const accounts = new Set(integrationAccounts.map((item) => item.account))

    const actualTransfers = transaction.transfers.filter(
      (transfer) => accounts.has(transfer.from) || accounts.has(transfer.to),
    )

    const [accountLinks, payments, currencies] = await Promise.all([
      this.loadAssignments(transaction.integration, actualTransfers, ctx),
      this.loadPayments(transaction.integration, actualTransfers, paymentConfig, ctx),
      this.loadCurrencies(transaction.integration, ctx),
    ])

    const accountLinksByAccount = new Map(
      accountLinks.map((assigment) => [assigment.integrationAccount.account, assigment]),
    )
    const integrationAccountByAccount = new Map(integrationAccounts.map((account) => [account.account, account]))

    const amounts = await this.loadPaymentAccumulatedAmounts(payments, transaction, ctx)

    return {
      integrationAccounts: integrationAccountByAccount,
      accountsLink: accountLinksByAccount,
      payments,
      accountsForPayment: await this.loadAccountForPayment(actualTransfers, ctx),
      actualTransfers,
      amounts,
      currencies,
    }
  }

  private async loadIntegrationAccounts(
    integration: IntegrationType,
    transfers: ReadonlyArray<TransferModel>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<IntegrationAccountModel>> {
    const addresses = new Set(transfers.flatMap((transfer) => [transfer.from, transfer.to]))

    if (addresses.size === 0) return []

    return await this.integrationAccountRepository.get(
      {
        integration,
        addresses,
      },
      ctx,
    )
  }

  private async loadAssignments(
    integration: IntegrationType,
    transfers: ReadonlyArray<TransferModel>,
    ctx: TxContext,
  ): Promise<ReadonlyArray<IntegrationAccountLinkModel>> {
    const accounts = new Set<IntegrationAccount>(transfers.map((transfer) => transfer.to))

    if (accounts.size === 0) return []

    return await this.accountLinkRepository.getActive(
      {
        integration,
        accounts,
      },
      ctx,
    )
  }

  private async loadPayments(
    integration: IntegrationType,
    transfers: ReadonlyArray<TransferModel>,
    config: { status: ReadonlySet<PaymentIntentStatus> },
    ctx: TxContext,
  ): Promise<PaymentIntentModel[]> {
    const uniqueParams = new Map<string, { to: IntegrationAccount; currency: IntegrationCurrency }>()

    const paymentKey = (data: { to: IntegrationAccount; currency: IntegrationCurrency }): string => {
      return `${data.to}${data.currency}`
    }

    for (const transfer of transfers) {
      const key = paymentKey(transfer)

      if (!uniqueParams.has(key)) {
        uniqueParams.set(key, {
          to: transfer.to,
          currency: transfer.currency,
        })
      }
    }

    if (uniqueParams.size === 0) return []

    return await this.paymentIntentRepository.findByParams(
      {
        integration,
        status: config.status,
        params: Array.from(uniqueParams.values()),
      },
      ctx,
    )
  }

  private async loadAccountForPayment(
    transfers: ReadonlyArray<TransferModel>,
    ctx: TxContext,
  ): Promise<ReadonlyMap<IntegrationAccount, AccountModel>> {
    const uuids = transfers.map((transfer) => transfer.to).filter((destination) => isUUID(destination)) as UUID[]

    if (uuids.length === 0) {
      return new Map()
    }

    const result = await this.accountRepository.getByIds(new Set(uuids), ctx)

    return new Map(result.map((account) => [IntegrationAccount.create(IntegrationType.INTERNAL, account.id), account]))
  }

  private async loadPaymentAccumulatedAmounts(
    payments: ReadonlyArray<PaymentIntentModel>,
    transaction: TransactionModel,
    ctx: TxContext,
  ): Promise<ReadonlyMap<UUID, ReadonlyArray<PaymentAmountAccumulatorModel>>> {
    const paymentIds = new Set(payments.map((payment) => payment.id))

    const result = await this.paymentAmountAccumulatorRepository.findByPaymentIds(paymentIds, ctx)

    const generateKey = (integration: IntegrationType, txId: Id, transferId: Id) => `${integration}${txId}${transferId}`
    const transfersKey = new Set(
      transaction.transfers.map((transfer) => generateKey(transaction.integration, transaction.id, transfer.id)),
    )

    const excludeCurrentTransfers = result.filter((item) => {
      const key = generateKey(item.integration, item.txId, item.transferId)

      return !transfersKey.has(key)
    })

    return Map.groupBy(excludeCurrentTransfers, (item) => item.paymentId)
  }

  private async loadCurrencies(
    integration: IntegrationType,
    ctx: TxContext,
  ): Promise<ReadonlyMap<IntegrationCurrency, IntegrationCurrencyModel>> {
    const result = await this.currencyRepository.findByIntegration({ integration }, ctx)

    return new Map(result.map((item) => [item.currency, item]))
  }
}
