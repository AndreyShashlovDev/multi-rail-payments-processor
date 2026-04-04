export interface CreateInboxData {
  readonly serviceName: string
  readonly idempotencyKey: string
  readonly data?: string | null
}
