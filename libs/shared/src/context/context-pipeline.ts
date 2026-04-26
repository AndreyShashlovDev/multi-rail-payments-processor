import { TxContext } from '@app/shared/types/tx-context.type'
import { EntityManager } from 'typeorm'

export abstract class UpgradableContext {
  abstract upgrade(em: EntityManager): this
}

export class ContextPipeline<T> {
  private readonly pipelines: ((ctx: TxContext, data: T) => Promise<T>)[] = []
  protected wasCommitted: boolean = false
  private readonly results: T[] = []

  constructor(
    protected readonly context: TxContext & UpgradableContext,
    private readonly initialData: T | undefined,
  ) {}

  getResults(): ReadonlyArray<T> {
    return this.results
  }

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

    const updatedContext = this.context.upgrade(queryRunner.manager)

    try {
      for (const pipeline of this.pipelines) {
        data = await pipeline(updatedContext, data!)

        if (data) {
          this.results.push(data)
        }
      }

      if (queryRunner.isTransactionActive && isInsideTxRun) {
        await queryRunner.commitTransaction()
        this.wasCommitted = true
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
