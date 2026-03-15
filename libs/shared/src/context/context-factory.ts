import { TxContext } from '@app/shared/types/tx-context.type'
import { DataSource } from 'typeorm'

export class ContextFactory {
  constructor(private readonly datasource: DataSource) {}

  createSimpleTxContext(): TxContext {
    return { em: this.datasource.manager, source: this.datasource }
  }
}
