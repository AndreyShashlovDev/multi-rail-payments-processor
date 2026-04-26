import { Injectable, Logger } from '@nestjs/common'
import { IntegrationJetstreamDataSource } from '../../data-source/nats-jetstream/integration/integration-jetstream-data-source.service'
import { OutboxRepository } from '../../repository/outbox/outbox.repository'
import { TransferIntentHeldData, EnqueueTransferCreateData } from './external-integration-publisher.types'
import { transferIntentSubject } from '@app/shared/nat-stream/transfer-intent-stream.types'
import { TransferIntentHeldEvent } from '@app/shared/services/external-integration/v1/event/transfer-intent-held.event'
import { TransferIntentCreateEvent } from '@app/shared/services/external-integration/v1'
import { Numeric } from '@app/types'
import { TxContext } from '@app/shared'

@Injectable()
export class ExternalIntegrationPublisher {
  private readonly logger: Logger = new Logger(ExternalIntegrationPublisher.name)

  constructor(
    private readonly integrationJetstreamDataSource: IntegrationJetstreamDataSource,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  isTransferCreateEvent(event: string): boolean {
    return event === TransferIntentCreateEvent.EVENT_NAME
  }

  isTransferHeldEvent(event: string): boolean {
    return event === TransferIntentHeldEvent.EVENT_NAME
  }

  async enqueueTransferCreate(data: EnqueueTransferCreateData, ctx: TxContext): Promise<void> {
    const { transfer, exponentByCurrency } = data

    const currencyExponentByFromIntegration = exponentByCurrency.get(transfer.fromIntegration)
    const estimatedFee = Numeric.toExponent(
      transfer.estimatedFee,
      currencyExponentByFromIntegration?.get(transfer.feeCurrency) ?? 18,
    )
    const fromAmount = Numeric.toExponent(
      transfer.fromAmount,
      currencyExponentByFromIntegration?.get(transfer.fromCurrency) ?? 18,
    )

    const currencyExponentByToIntegration = exponentByCurrency.get(transfer.toIntegration)
    const toAmount = Numeric.toExponent(
      transfer.toAmount,
      currencyExponentByToIntegration?.get(transfer.toCurrency) ?? 18,
    )

    const payload = new TransferIntentCreateEvent(
      transfer.intentId,
      transfer.intentId,
      transfer.intentType,
      estimatedFee,
      transfer.feeCurrency,
      fromAmount,
      transfer.fromIntegration,
      transfer.fromCurrency,
      transfer.from,
      toAmount,
      transfer.toIntegration,
      transfer.toCurrency,
      transfer.to,
    )

    await this.outboxRepository.create(
      {
        id: payload.uniqueKey,
        event: TransferIntentCreateEvent.EVENT_NAME,
        payload: JSON.stringify(payload),
      },
      ctx,
    )
  }

  async enqueueTransferHeld(data: TransferIntentHeldData, ctx: TxContext): Promise<void> {
    const payload = new TransferIntentHeldEvent(
      `${data.intentType}-${data.intentIds.join(',')}`,
      data.intentType,
      data.intentIds,
    )

    await this.outboxRepository.create(
      {
        id: payload.uniqueKey,
        event: TransferIntentHeldEvent.EVENT_NAME,
        payload: JSON.stringify(payload),
      },
      ctx,
    )
  }

  async publishTransferCreate(data: TransferIntentCreateEvent): Promise<void> {
    await this.integrationJetstreamDataSource.publish(transferIntentSubject('create'), data)
  }

  async publishTransferHeld(data: TransferIntentHeldEvent): Promise<void> {
    await this.integrationJetstreamDataSource.publish(transferIntentSubject('held'), data)
  }
}
