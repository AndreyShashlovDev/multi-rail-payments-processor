import { KafkaConsumerConfig, KafkaTopicConfig } from './base-kafka.service'

const DAY_MS = 86_400_000

export interface KafkaTopicSet {
  readonly name: string
  readonly topic: KafkaTopicConfig
  readonly dlq: KafkaTopicConfig
  consumer(groupId: string): KafkaConsumerConfig
}

function topicSet(name: string): KafkaTopicSet {
  const dlqName = `${name}.dlq`

  return {
    name,
    // same reasoning as TRANSACTION_TOPIC: over-provision once instead of resizing later
    topic: { name, numPartitions: 12, retentionMs: 7 * DAY_MS },
    dlq: { name: dlqName, numPartitions: 1, retentionMs: 45 * DAY_MS },
    consumer: (groupId) => ({
      topic: name,
      groupId,
      dlqTopic: dlqName,
      maxRetries: 3,
      retryBaseDelayMs: 1_000,
      retryMaxDelayMs: 30_000,
    }),
  }
}

// orchestrator → executors. Keyed by `${executionType}:${integration}`, so a per-network
// executor service only has to own its partitions.
export const TRANSFER_ROUTE_COMMAND_TOPIC_SET = topicSet('transfer-route.command')

// executors → orchestrator, one topic per message type
export const TRANSFER_ROUTE_COMPLETED_TOPIC_SET = topicSet('transfer-route.completed')
export const TRANSFER_ROUTE_FAILED_TOPIC_SET = topicSet('transfer-route.failed')
