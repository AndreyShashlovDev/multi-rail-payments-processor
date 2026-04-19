import { AckPolicy } from 'nats/lib/jetstream/jsapi_types'
import { StreamConfig, ConsumerConfig } from './base-nats.service'

export const BALANCE_UPDATED_STREAM_NAME = 'BALANCE_UPDATED'
export const BALANCE_UPDATED_STREAM_SUBJECT: string = BALANCE_UPDATED_STREAM_NAME.toLowerCase()

export const BALANCE_UPDATED_STREAM: StreamConfig = {
  name: BALANCE_UPDATED_STREAM_NAME,
  subjects: [`${BALANCE_UPDATED_STREAM_SUBJECT}`],
  maxMessages: 1_000_000,
  maxAge: 86400 * 1000_000_000 * 7, // 7 days
}

export const BALANCE_UPDATED_CONSUMER: ConsumerConfig = {
  stream: BALANCE_UPDATED_STREAM_NAME,
  durable: 'balance-updated-processor',
  filterSubject: `${BALANCE_UPDATED_STREAM_SUBJECT}`,
  ackPolicy: AckPolicy.Explicit,
  maxDeliver: 3,
  maxAckPending: 10,
}
