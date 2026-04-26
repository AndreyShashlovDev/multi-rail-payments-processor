import { TxContext, BasicTypeOrmContext } from '@app/shared/types/tx-context.type'
import { ContextFactory } from '@app/shared/context/context-factory'
import { ContextPipeline } from '@app/shared/context/context-pipeline'

export class TxContextRunner {
  constructor(private readonly contextFactory: ContextFactory) {}

  create<T = void>(ctx?: TxContext): ContextPipeline<T> {
    if (ctx && !(ctx instanceof BasicTypeOrmContext)) {
      throw new Error(
        `TxContextRunner.create requires BasicTypeOrmContext but received ${ctx?.constructor.name}. Use TxContextRunner with correct context.`,
      )
    }

    return new ContextPipeline<T>(this.contextFactory.createSimpleTxContext(ctx), undefined)
  }

  createWithData<T>(data?: T, ctx?: TxContext): ContextPipeline<T> {
    if (ctx && !(ctx instanceof BasicTypeOrmContext)) {
      throw new Error(
        `TxContextRunner.create requires BasicTypeOrmContext but received ${ctx?.constructor.name}. Use TxContextRunner with correct context.`,
      )
    }

    return new ContextPipeline<T>(this.contextFactory.createSimpleTxContext(ctx), data)
  }
}
