import { PaymentIntentRepository } from '../../../data/repository/payment-intent/payment-intent.repository'
import { UUID, IntegrationCurrency } from '@app/types'
import { IntegrationAccountLinkModel } from '../../../shared/model/integration-account-link.model'
import { PaymentIntentModel, PaymentIntentStatus } from '../model/payment-intent.model'
import { IntegrationAccount } from '@app/types/integration-account'
import { Injectable } from '@nestjs/common'
import {
  IntegrationAccountLinkRepository,
} from '../../../data/repository/integration-account-link/integration-account-link.repository'
import {
  IntegrationAccountRepository,
} from '../../../data/repository/integration-account/integration-account.repository'
import { IntegrationType } from '@app/shared'
import { IntegrationAccountModel } from '../../../shared/model/integration-account.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { AccountRepository } from '../../../data/repository/account/account.repository'
import { AccountModel } from '../../../shared/model/account.model'
import { isUUID } from 'class-validator'
import { TransactionModel } from '../../../shared/model/transaction.model'
import { TransferModel } from '../../../shared/model/transfer.model'

export interface TransactionDataResult {
  readonly integrationAccounts: ReadonlyMap<IntegrationAccount, IntegrationAccountModel>
  readonly accountsLink: ReadonlyMap<IntegrationAccount, IntegrationAccountLinkModel>
  readonly payments: ReadonlyArray<PaymentIntentModel>
  readonly accountsForPayment: ReadonlyMap<IntegrationAccount, AccountModel>
}

export interface LookupData {
  readonly transaction: Omit<TransactionModel, 'transfers'>
  readonly transfers: ReadonlyArray<TransferModel>
  readonly paymentConfig: { status: PaymentIntentStatus.CREATED | PaymentIntentStatus.CONFIRMING }
}

@Injectable()
export class PaymentTransactionDataLoader {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountLinkRepository: IntegrationAccountLinkRepository,
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly integrationAccountRepository: IntegrationAccountRepository,
  ) {}

  async getLookupData(data: LookupData, ctx: TxContext): Promise<TransactionDataResult> {
    const { transaction, transfers, paymentConfig } = data

    const [integrationAccounts, accountLinks, payments] = await Promise.all([
      this.loadIntegrationAccounts(transaction.integration, transfers, ctx),
      this.loadAssignments(transaction.integration, transfers, ctx),
      this.loadPayments(transaction.integration, transfers, paymentConfig, ctx),
    ])

    const accountLinksByAccount = new Map(
      accountLinks.map((assigment) => [assigment.integrationAccount.account, assigment]),
    )
    const integrationAccountByAccount = new Map(integrationAccounts.map((account) => [account.account, account]))

    return {
      integrationAccounts: integrationAccountByAccount,
      accountsLink: accountLinksByAccount,
      payments,
      accountsForPayment: await this.loadAccountForPayment(transfers, ctx),
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
    config: { status: PaymentIntentStatus.CREATED | PaymentIntentStatus.CONFIRMING },
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

    return await this.paymentIntentRepository.findActiveByParams(
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
}
