import { KafkaConsumerConfig, KafkaTopicConfig } from './base-kafka.service'

const DAY_MS = 86_400_000

export const TRANSACTION_TOPIC_NAME = 'transaction'
export const TRANSACTION_DLQ_TOPIC_NAME = `${TRANSACTION_TOPIC_NAME}.dlq`

export const TRANSACTION_TOPIC: KafkaTopicConfig = {
  name: TRANSACTION_TOPIC_NAME,
  // sized well above today's IntegrationType count on purpose: growing
  // partitions later reshuffles key->partition hashing (see ensureTopic),
  // so it's cheaper to over-provision once now than to resize a topic with
  // real traffic on it later
  numPartitions: 12,
  // same 7-day window as TRANSACTION_STREAM's maxAge on the NATS side
  retentionMs: 7 * DAY_MS,
}

export const TRANSACTION_DLQ_TOPIC: KafkaTopicConfig = {
  name: TRANSACTION_DLQ_TOPIC_NAME,
  // low volume, read by humans/tooling — no need to parallelize
  numPartitions: 1,
  // DLQ needs more runway than the main topic: someone has to notice,
  // investigate and (maybe) manually replay a dead-lettered message
  retentionMs: 45 * DAY_MS,
}

export function transactionKafkaConsumer(groupId: string): KafkaConsumerConfig {
  return {
    topic: TRANSACTION_TOPIC_NAME,
    groupId,
    dlqTopic: TRANSACTION_DLQ_TOPIC_NAME,
    maxRetries: 3,
    retryBaseDelayMs: 1_000,
    retryMaxDelayMs: 30_000,
  }
}
