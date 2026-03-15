import { AckPolicy } from 'nats/lib/jetstream/jsapi_types'
import { StreamConfig, ConsumerConfig } from './base-nats.service'
import { IntegrationType } from '@app/shared/types'

export const TRANSACTION_STEAM_NAME = 'TRANSACTION'
export const TRANSACTION_STREAM_SUBJECT: string = TRANSACTION_STEAM_NAME.toLowerCase()

export function transactionSubject(integration: IntegrationType): string {
  return `${TRANSACTION_STREAM_SUBJECT}.${integration.toLowerCase()}`
}

export const TRANSACTION_STREAM: StreamConfig = {
  name: TRANSACTION_STEAM_NAME,
  subjects: [`${TRANSACTION_STREAM_SUBJECT}.>`],
  maxMessages: 1_000_000,
  maxAge: 86400 * 1000_000_000 * 7, // 7 days
}

export function transactionConsumer(integration: IntegrationType): ConsumerConfig {
  return {
    stream: TRANSACTION_STEAM_NAME,
    durable: `transaction-processor-${integration.toLowerCase()}`,
    filterSubject: transactionSubject(integration),
    ackPolicy: AckPolicy.Explicit,
    maxDeliver: 3,
    maxAckPending: 1,
  }
}
