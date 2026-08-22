import { JsonObject } from '@app/types'
import { TransactionEvent } from '../services/external-integration/v1'

/**
 * Transport-agnostic seam between the `transaction` event pipeline and
 * whichever broker carries it (NATS JetStream or Kafka). Business/handler
 * code depends only on these abstract classes, never on a concrete
 * transport class — the transport actually wired up is picked once, at
 * boot, via TRANSACTION_EVENT_TRANSPORT (see the *-source.module.ts
 * DynamicModules), by binding `useExisting` to the concrete data source.
 *
 * These are plain classes (not interfaces, not Symbol/string tokens) on
 * purpose: NestJS resolves constructor params by their reflected design
 * type, so injecting an abstract class needs no @Inject() decorator and no
 * magic token to keep in sync.
 */
export interface TransactionEventHandler {
  transactionEventHandler(event: JsonObject<TransactionEvent>): Promise<void>
}

export abstract class TransactionEventSource {
  abstract setupHandler(handler: TransactionEventHandler | null): void
}
