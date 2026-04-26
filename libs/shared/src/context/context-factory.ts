import { BasicTypeOrmContext, OutboxTypeOrmContext } from '@app/shared/types/tx-context.type'
import { DataSource } from 'typeorm'

export class ContextFactory {
  constructor(private readonly datasource: DataSource) {}

  createSimpleTxContext(ctx?: BasicTypeOrmContext): BasicTypeOrmContext {
    return ctx ? ctx : new BasicTypeOrmContext(this.datasource.manager, this.datasource)
  }

  createOutboxTxContext(ctx?: OutboxTypeOrmContext): OutboxTypeOrmContext {
    return ctx ? ctx : new OutboxTypeOrmContext(this.datasource.manager, this.datasource)
  }
}
