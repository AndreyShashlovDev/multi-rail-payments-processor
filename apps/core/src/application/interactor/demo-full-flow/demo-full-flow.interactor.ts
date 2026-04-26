import { AbstractInteractor, UUID, IntegrationCurrency, Numeric } from '@app/types'
import { IntegrationAccountLinkRepository } from '../../../data/repository/integration-account-link/integration-account-link.repository'
import { LedgerRepository } from '../../../data/repository/ledger/ledger.repository'
import { Injectable, Logger } from '@nestjs/common'
import { IntegrationType, BalanceChangeType, OutboxTxContextRunner } from '@app/shared'
import { WrongCreditFundsAmountException } from '../../exception/wrong-credit-funds-amount.exception'
import { PlatformDepositAccountNotFoundException } from '../../exception/platform-deposit-account-not-found.exception'
import { randomUUID } from 'node:crypto'
import { BalanceChangeReason } from '@app/shared/types/balance-change'
import { AccountRepository } from '../../../data/repository/account/account.repository'
import { CreatePaymentIntentInteractor } from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent.interactor'
import {
  PaymentPlatformFeePayerType,
  PaymentOperationType,
} from '../../../module/payment-intent/model/payment-intent.model'
import { CreatePayoutIntentInteractor } from '../../../module/payout-intent/interactor/create-payout-intent/create-payout-intent.interactor'
import { PayoutOperationType } from '../../../module/payout-intent/model/payout-intent.model'
import { LedgerPublisher } from '../../../data/publisher/ledger/ledger.publisher'
import { ChangeBalanceData } from '../../../data/publisher/ledger/ledger-publisher.types'

/**
 * @deprecated remove it in real project! just for example. simulation
 */
@Injectable()
export class DemoFullFlowInteractor extends AbstractInteractor<never, Promise<void>> {
  private static readonly INTEGRATION: IntegrationType = IntegrationType.ETHEREUM
  private static readonly CURRENCY: IntegrationCurrency = 'native'
  private static readonly BASIC_AMOUNT: Numeric = Numeric.create(5)
  private static readonly EXCHANGE_AMOUNT: Numeric = Numeric.create(5)

  private readonly logger: Logger = new Logger(DemoFullFlowInteractor.name)

  constructor(
    private readonly txRunner: OutboxTxContextRunner,
    private readonly integrationAccountLinkRepository: IntegrationAccountLinkRepository,
    private readonly accountRepository: AccountRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly ledgerPublisher: LedgerPublisher,
    private readonly createPaymentIntentInteractor: CreatePaymentIntentInteractor,
    private readonly createPayoutIntentInteractor: CreatePayoutIntentInteractor,
  ) {
    super()
    this.logger.fatal('DemoFullFlowInteractor ENABLED! Remove it!')
  }

  async execute(): Promise<void> {
    const platformHotAccount = await this.integrationAccountLinkRepository.getPlatformHotAccount({
      currency: DemoFullFlowInteractor.CURRENCY,
      integration: DemoFullFlowInteractor.INTEGRATION,
    })

    const paymentMerchant = await this.accountRepository.getRandomMerchant()

    if (!platformHotAccount || !paymentMerchant) {
      throw new PlatformDepositAccountNotFoundException()
    }

    const payoutMerchant = await this.accountRepository.getRandomMerchant(new Set([paymentMerchant?.id]))

    if (!payoutMerchant) {
      throw new PlatformDepositAccountNotFoundException()
    }

    this.logger.debug(`Platform hot account ${platformHotAccount.platformAccountId}`)
    this.logger.debug(`Payment platform account ${paymentMerchant.id}`)
    this.logger.debug(`Payout platform account ${payoutMerchant.id}`)

    const balances = await this.ledgerRepository.getBalances({
      platform: [
        {
          accountId: platformHotAccount.platformAccountId,
          integration: DemoFullFlowInteractor.INTEGRATION,
          currencies: new Set([DemoFullFlowInteractor.CURRENCY]),
        },
        {
          accountId: payoutMerchant.id,
          integration: DemoFullFlowInteractor.INTEGRATION,
          currencies: new Set([DemoFullFlowInteractor.CURRENCY]),
        },
      ],
      integration: [
        {
          account: platformHotAccount.integrationAccount.account,
          integration: DemoFullFlowInteractor.INTEGRATION,
          currencies: new Set([DemoFullFlowInteractor.CURRENCY]),
        },
      ],
    })

    const hotAccountBalance = balances.platform
      .get(platformHotAccount.platformAccountId)
      ?.get(DemoFullFlowInteractor.INTEGRATION)
      ?.get(DemoFullFlowInteractor.CURRENCY)

    if (!hotAccountBalance || hotAccountBalance.available.lte(DemoFullFlowInteractor.BASIC_AMOUNT)) {
      const amount = DemoFullFlowInteractor.BASIC_AMOUNT.mul(10)

      await this.deposit({
        platformAccount: platformHotAccount.platformAccountId,
        integration: DemoFullFlowInteractor.INTEGRATION,
        currency: DemoFullFlowInteractor.CURRENCY,
        amount,
      })

      this.logger.debug(`Deposit funds into Platform (hot) account. ${amount.toString()}`)

      await this.delay(2000)
    }

    const payoutAccountBalance = balances.platform
      .get(payoutMerchant.id)
      ?.get(DemoFullFlowInteractor.INTEGRATION)
      ?.get(DemoFullFlowInteractor.CURRENCY)

    if (!payoutAccountBalance || payoutAccountBalance.available.lte(DemoFullFlowInteractor.BASIC_AMOUNT)) {
      const amount = DemoFullFlowInteractor.BASIC_AMOUNT.mul(4)

      await this.deposit({
        platformAccount: payoutMerchant.id,
        integration: DemoFullFlowInteractor.INTEGRATION,
        currency: DemoFullFlowInteractor.CURRENCY,
        amount,
      })

      this.logger.debug(`Deposit funds into merchant account to make the payout. ${amount.toString()}`)

      await this.delay(2000)
    }

    const payment = await this.createPaymentIntentInteractor.execute({
      operationType: PaymentOperationType.USER_REQUEST,
      platformAccountId: paymentMerchant.id,
      userId: paymentMerchant.owner,
      integration: DemoFullFlowInteractor.INTEGRATION,
      currency: DemoFullFlowInteractor.CURRENCY,
      amount: DemoFullFlowInteractor.EXCHANGE_AMOUNT,
      platformFeePayer: PaymentPlatformFeePayerType.CLIENT,
    })

    this.logger.debug(`Payment id ${payment.id}`)

    const payout = await this.createPayoutIntentInteractor.execute({
      operationType: PayoutOperationType.USER_REQUEST,
      platformMember: {
        accountId: payoutMerchant.id,
        userId: payoutMerchant.owner,
      },
      amount: DemoFullFlowInteractor.EXCHANGE_AMOUNT,
      fromIntegration: DemoFullFlowInteractor.INTEGRATION,
      fromCurrency: DemoFullFlowInteractor.CURRENCY,
      toAccount: payment.to.account,
      estimatedTransferFeeId: randomUUID(),
    })

    this.logger.debug(`Payout id ${payout.id}`)

    this.logger.debug(`Payment/Payout exchange ${DemoFullFlowInteractor.EXCHANGE_AMOUNT.toString()}`)
    this.logger.debug(`Please wait about minute...`)
  }

  private delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), ms))
  }

  private async deposit(params: {
    readonly platformAccount: UUID
    readonly integration: IntegrationType
    readonly currency: IntegrationCurrency
    readonly amount: Numeric
  }): Promise<void> {
    if (params.amount.lte(Numeric.ZERO)) {
      throw new WrongCreditFundsAmountException(params.amount)
    }

    const hotAccount = await this.integrationAccountLinkRepository.getPlatformHotAccount({
      integration: params.integration,
      currency: params.currency,
    })

    if (!hotAccount) {
      throw new PlatformDepositAccountNotFoundException()
    }

    const data: ChangeBalanceData = {
      idempotencyKey: randomUUID(),
      changes: [
        {
          type: BalanceChangeType.CREDIT,
          intentType: null,
          intentId: null,
          operationType: null,
          platformAccountId: null,
          integrationAccount: hotAccount.integrationAccount.account,
          currency: params.currency,
          integration: params.integration,
          amount: params.amount,
          metadata: {
            reason: BalanceChangeReason.MANUAL_CORRECTION,
          },
        },
        {
          type: BalanceChangeType.CREDIT,
          intentType: null,
          intentId: null,
          operationType: null,
          platformAccountId: params.platformAccount,
          integrationAccount: null,
          currency: params.currency,
          integration: params.integration,
          amount: params.amount,
          metadata: {
            reason: BalanceChangeReason.MANUAL_CORRECTION,
          },
        },
      ],
    }

    await this.txRunner
      .create()
      .pipeline(async (ctx) => await this.ledgerPublisher.enqueue(data, ctx))
      .execute()
  }
}
