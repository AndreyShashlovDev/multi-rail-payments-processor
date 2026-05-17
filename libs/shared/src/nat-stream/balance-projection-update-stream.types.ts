import { AckPolicy } from 'nats/lib/jetstream/jsapi_types'
import { StreamConfig, ConsumerConfig } from './base-nats.service'

export const BALANCE_PROJECTION_UPDATE_STREAM_NAME = 'BALANCE_PROJECTION_UPDATE'
export const BALANCE_PROJECTION_UPDATE_STREAM_SUBJECT = BALANCE_PROJECTION_UPDATE_STREAM_NAME.toLowerCase()

export const BALANCE_PROJECTION_UPDATED_SUBJECT = `${BALANCE_PROJECTION_UPDATE_STREAM_SUBJECT}.updated`

export const BALANCE_PROJECTION_UPDATE_STREAM: StreamConfig = {
  name: BALANCE_PROJECTION_UPDATE_STREAM_NAME,
  subjects: [`${BALANCE_PROJECTION_UPDATE_STREAM_SUBJECT}.>`],
  maxMessages: 1_000_000,
  maxAge: 86400 * 1000_000_000 * 7, // 7 days
}

export const BALANCE_PROJECTION_UPDATE_CONSUMER: ConsumerConfig = {
  stream: BALANCE_PROJECTION_UPDATE_STREAM_NAME,
  durable: BALANCE_PROJECTION_UPDATE_STREAM_SUBJECT,
  filterSubject: BALANCE_PROJECTION_UPDATED_SUBJECT,
  ackPolicy: AckPolicy.Explicit,
  maxDeliver: 3,
  maxAckPending: 100,
}
