export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export type OutboxUniqueKey = string

export interface OutboxData {
  readonly id: OutboxUniqueKey
  readonly event: string
  readonly payload: string
}

export interface OutboxModel extends OutboxData {
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly status: OutboxStatus
  readonly processingAt: Date | null
  readonly sentAt: Date | null
  readonly retries: number
}
