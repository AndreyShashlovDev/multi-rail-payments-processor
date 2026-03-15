import { AckPolicy } from 'nats/lib/jetstream/jsapi_types'
import { StreamConfig, ConsumerConfig } from './base-nats.service'

export const TRANSFER_INTENT_STEAM_NAME = 'TRANSFER_INTENT'
export const TRANSFER_INTENT_STREAM_SUBJECT: string = TRANSFER_INTENT_STEAM_NAME.toLowerCase()
export type TransferIntentEventType = 'create' | 'update' | 'held'

export function transferIntentSubject(type: TransferIntentEventType): string {
  return `${TRANSFER_INTENT_STREAM_SUBJECT}.${type.toLowerCase()}`
}

export const TRANSFER_INTENT_STREAM: StreamConfig = {
  name: TRANSFER_INTENT_STEAM_NAME,
  subjects: [`${TRANSFER_INTENT_STREAM_SUBJECT}.>`],
  maxMessages: 1_000_000,
  maxAge: 86400 * 1000_000_000 * 7, // 7 days
}

export function transferIntentConsumer(type: TransferIntentEventType): ConsumerConfig {
  return {
    stream: TRANSFER_INTENT_STEAM_NAME,
    durable: `transfer-intent-processor-${type.toLowerCase()}`,
    filterSubject: transferIntentSubject(type),
    ackPolicy: AckPolicy.Explicit,
    maxDeliver: 3,
    maxAckPending: 100,
  }
}
