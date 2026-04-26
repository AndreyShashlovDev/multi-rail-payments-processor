import { TxContext, OutboxTypeOrmContext } from '@app/shared/types/tx-context.type'
import { ContextFactory } from '@app/shared/context/context-factory'
import { ContextPipeline, UpgradableContext } from '@app/shared/context/context-pipeline'
import { OutboxNotifier } from '@app/shared/outbox/outbox-notifier'
import { Logger } from '@nestjs/common'

class OutboxContextPipeline<T> extends ContextPipeline<T> {
  private readonly logger = new Logger(OutboxContextPipeline.name)

  constructor(
    context: TxContext & UpgradableContext,
    private readonly notifier: OutboxNotifier,
    initialData?: T,
  ) {
    super(context, initialData)
  }

  async execute(): Promise<T> {
    const result = await super.execute()

    const outboxWritten = this.context instanceof OutboxTypeOrmContext && this.context.outboxWritten

    if (outboxWritten && this.wasCommitted) {
      this.notifier.notify().catch((e) => this.logger.error(e))
    }

    return result
  }
}

export class OutboxTxContextRunner {
  constructor(
    private readonly contextFactory: ContextFactory,
    private readonly notifier: OutboxNotifier,
  ) {}

  create<T>(ctx?: TxContext): ContextPipeline<T> {
    if (ctx && !(ctx instanceof OutboxTypeOrmContext)) {
      throw new Error(
        `OutboxTxContextRunner.create requires OutboxTypeOrmContext but received ${ctx?.constructor.name}. Use OutboxTxContextRunner to create OutboxTypeOrmContext.`,
      )
    }

    return new OutboxContextPipeline<T>(this.contextFactory.createOutboxTxContext(ctx), this.notifier)
  }
}
