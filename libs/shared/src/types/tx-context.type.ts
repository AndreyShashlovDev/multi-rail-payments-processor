import { EntityManager, DataSource } from 'typeorm'
import { UpgradableContext } from '@app/shared/context/context-pipeline'

export type TxContext = TypeOrmContext

export interface TypeOrmContext {
  readonly source: DataSource
  get em(): EntityManager
}

abstract class UpgradableTypeOrmContext extends UpgradableContext {
  protected _em: EntityManager
  readonly source: DataSource

  get em(): EntityManager {
    return this._em
  }

  protected constructor(em: EntityManager, source: DataSource) {
    super()
    this._em = em
    this.source = source
  }

  upgrade(em: EntityManager): this {
    this._em = em

    return this
  }
}

export class BasicTypeOrmContext extends UpgradableTypeOrmContext {
  constructor(em: EntityManager, source: DataSource) {
    super(em, source)
  }
}

export class OutboxTypeOrmContext extends BasicTypeOrmContext {
  private _outboxWritten: boolean = false

  constructor(em: EntityManager, source: DataSource) {
    super(em, source)
  }

  get outboxWritten(): boolean {
    return this._outboxWritten
  }

  markOutboxWritten(): void {
    this._outboxWritten = true
  }
}
