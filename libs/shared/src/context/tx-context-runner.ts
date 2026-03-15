import { TxContext } from '@app/shared/types/tx-context.type'
import { ContextFactory } from '@app/shared/context/context-factory'

class ContextPipeline<T> {
  private readonly pipelines: ((ctx: TxContext, data?: T) => Promise<T>)[] = []

  constructor(
    private readonly context: TxContext,
    private readonly initialData?: T,
  ) {}

  pipeline(callback: (ctx: TxContext, data: T) => Promise<T>): this {
    this.pipelines.push(callback)
    return this
  }

  async execute(): Promise<T> {
    if (this.pipelines.length === 0) {
      throw new Error('Pipeline not presented!')
    }

    let data = this.initialData
    const queryRunner = this.context.em.queryRunner ?? this.context.source.createQueryRunner()
    let isInsideTxRun: boolean = false

    if (!queryRunner) {
      throw new Error('TypeOrm query runner not exist!')
    }

    if (!queryRunner.isTransactionActive) {
      await queryRunner.startTransaction()
      isInsideTxRun = true
    }

    try {
      for (const pipeline of this.pipelines) {
        data = await pipeline({ em: queryRunner.manager, source: this.context.source }, data)
      }

      if (queryRunner.isTransactionActive && isInsideTxRun) {
        await queryRunner.commitTransaction()
      }

      return data!
    } catch (e) {
      if (queryRunner.isTransactionActive && !queryRunner.isReleased) {
        await queryRunner.rollbackTransaction()
      }

      throw e
    } finally {
      if (!queryRunner.isReleased && isInsideTxRun) {
        await queryRunner.release()
      }
    }
  }
}

export class TxContextRunner {
  constructor(private readonly contextFactory: ContextFactory) {}

  create(ctx?: TxContext): ContextPipeline<void> {
    return new ContextPipeline(ctx ?? this.contextFactory.createSimpleTxContext())
  }

  createWithData<T>(data?: T, ctx?: TxContext): ContextPipeline<T> {
    return new ContextPipeline<T>(ctx ?? this.contextFactory.createSimpleTxContext(), data)
  }
}
