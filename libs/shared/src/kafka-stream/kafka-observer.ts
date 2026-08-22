export type KafkaObserverEvent =
  | { readonly type: 'consumer_started'; readonly groupId: string; readonly topic: string }
  | {
      readonly type: 'retry'
      readonly groupId: string
      readonly topic: string
      readonly partition: number
      readonly attempt: number
      readonly maxRetries: number
      readonly delayMs: number
      readonly error: Error
    }
  | {
      readonly type: 'dlq_sent'
      readonly groupId: string
      readonly topic: string
      readonly partition: number
      readonly dlqTopic: string
    }
  | {
      readonly type: 'dlq_send_failed'
      readonly groupId: string
      readonly topic: string
      readonly partition: number
      readonly dlqTopic: string
      readonly error: Error
    }
  | {
      readonly type: 'commit_lost'
      readonly groupId: string
      readonly topic: string
      readonly partition: number
      readonly error: Error
    }
  | { readonly type: 'crash'; readonly groupId: string; readonly error: Error; readonly willRestart: boolean }
  | {
      readonly type: 'stall_recycle'
      readonly groupId: string
      readonly topic: string
      readonly nodeId: number
      readonly stallTimeoutMs: number
    }

export interface KafkaObserver {
  onEvent(event: KafkaObserverEvent): void
}

export class ConsoleKafkaObserver implements KafkaObserver {
  onEvent(event: KafkaObserverEvent): void {
    const { type, ...fields } = event

    console.log(`[kafka-observer] ${type}`, fields)
  }
}
