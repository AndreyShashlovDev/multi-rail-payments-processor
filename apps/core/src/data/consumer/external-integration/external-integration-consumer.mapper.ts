import { TransactionEvent, TransferEventData } from '@app/shared/services/external-integration/v1'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { TransactionModel } from '../../../shared/model/transaction.model'
import { TransferModel } from '../../../shared/model/transfer.model'
import { IntegrationCurrency, Numeric, JsonObject } from '@app/types'
import { IntegrationType } from '@app/shared'

export class ExternalIntegrationConsumerMapper {
  static transactionEventValidate(event: JsonObject<TransactionEvent>): TransactionEvent {
    // check by event.ver
    const instance = plainToInstance(TransactionEvent, event, {
      exposeDefaultValues: true,
    })

    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: false,
    })

    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('; ')}`,
      )
    }
    return instance
  }

  static transactionEventToDomain(
    event: TransactionEvent,
    exponentByCurrency: ReadonlyMap<IntegrationType, ReadonlyMap<IntegrationCurrency, number>>,
  ): TransactionModel {
    const currencyExponentByIntegration =
      exponentByCurrency.get(event.integration) ?? new Map<IntegrationCurrency, number>()
    const fee = event.fee
      ? Numeric.fromExponent(event.fee, currencyExponentByIntegration?.get(event.feeCurrency) ?? 18)
      : null
    const transfers = event.transfers.map((transfer) =>
      ExternalIntegrationConsumerMapper.transferEventToDomain(transfer, currencyExponentByIntegration),
    )

    return {
      id: event.id,
      sourceTxId: event.sourceTxId,
      integration: event.integration,
      status: event.status,
      feeCurrency: event.feeCurrency,
      fee,
      executedAt: event.executedDate ? new Date(event.executedDate) : null,
      transfers,
    }
  }

  private static transferEventToDomain(
    transferEvent: TransferEventData,
    exponentByCurrency: ReadonlyMap<IntegrationCurrency, number>,
  ): TransferModel {
    const amount = Numeric.fromExponent(transferEvent.rawAmount, exponentByCurrency.get(transferEvent.currency) ?? 18)

    return {
      ...transferEvent,
      amount,
      intent: transferEvent.intent,
    }
  }
}
