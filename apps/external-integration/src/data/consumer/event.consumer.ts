import { plainToInstance, ClassConstructor } from 'class-transformer'
import { validateSync } from 'class-validator'
import { toError } from '@app/utils'
import { BasicEvent, JsonObject } from '@app/types'

export interface EventSubscription<T> {
  readonly handler: (event: T) => Promise<void>
}

// Validates an incoming message against its contract class and fans it out to all subscribers.
// Concrete consumers only bind it to their data source.
export abstract class EventConsumer<T extends BasicEvent> {
  private readonly subscriptions: EventSubscription<T>[] = []

  protected constructor(private readonly contract: ClassConstructor<T>) {}

  subscribe(subscription: EventSubscription<T>): void {
    this.subscriptions.push(subscription)
  }

  // plain: the raw JSON of the contract as it came from the transport, not validated yet
  protected async dispatch(plain: JsonObject<T>): Promise<void> {
    const event = this.validate(plain)

    const result = await Promise.allSettled(this.subscriptions.map(async (sub) => await sub.handler(event)))

    const failed = result.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

    if (failed.length > 0) {
      const reasons = failed.map((r) => toError(r.reason).message).join(', ')
      throw new Error(`${failed.length} handler(s) failed: ${reasons}`)
    }
  }

  private validate(plain: JsonObject<T>): T {
    const instance = plainToInstance(this.contract, plain, { exposeDefaultValues: true })

    const errors = validateSync(instance, { whitelist: true, forbidNonWhitelisted: false })

    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('; ')}`,
      )
    }

    return instance
  }
}
