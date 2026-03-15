import { AckPolicy } from 'nats/lib/jetstream/jsapi_types'
import { StreamConfig, ConsumerConfig } from './base-nats.service'
import { IntegrationType } from '@app/shared/types'

export const BALANCE_CHANGE_STEAM_NAME = 'BALANCE_CHANGE'
export const BALANCE_CHANGE_STREAM_SUBJECT: string = BALANCE_CHANGE_STEAM_NAME.toLowerCase()

export function balanceChangeSubject(integration: IntegrationType): string {
  return `${BALANCE_CHANGE_STREAM_SUBJECT}.${integration.toLowerCase()}`
}

export const BALANCE_CHANGE_STREAM: StreamConfig = {
  name: BALANCE_CHANGE_STEAM_NAME,
  subjects: [`${BALANCE_CHANGE_STREAM_SUBJECT}.>`],
  maxMessages: 1_000_000,
  maxAge: 86400 * 1000_000_000 * 7, // 7 days
}

export function balanceChangeConsumer(integration: IntegrationType): ConsumerConfig {
  return {
    stream: BALANCE_CHANGE_STEAM_NAME,
    durable: `balance-change-processor-${integration.toLowerCase()}`,
    filterSubject: balanceChangeSubject(integration),
    ackPolicy: AckPolicy.Explicit,
    maxDeliver: 3,
    maxAckPending: 1, // one at a time - a guarantee of order within the integration
  }
}
