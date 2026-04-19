import { AckPolicy } from 'nats/lib/jetstream/jsapi_types'
import { StreamConfig, ConsumerConfig } from './base-nats.service'

export const BALANCE_FAILED_STREAM_NAME = 'BALANCE_FAILED'
export const BALANCE_FAILED_STREAM_SUBJECT: string = BALANCE_FAILED_STREAM_NAME.toLowerCase()

export const BALANCE_FAILED_STREAM: StreamConfig = {
  name: BALANCE_FAILED_STREAM_NAME,
  subjects: [BALANCE_FAILED_STREAM_SUBJECT],
  maxMessages: 1_000_000,
  maxAge: 86400 * 1_000_000_000 * 7, // 7 days
}

export const BALANCE_FAILED_CONSUMER: ConsumerConfig = {
  stream: BALANCE_FAILED_STREAM_NAME,
  durable: 'balance-failed-processor',
  filterSubject: BALANCE_FAILED_STREAM_SUBJECT,
  ackPolicy: AckPolicy.Explicit,
  maxDeliver: 3,
  maxAckPending: 10,
}
