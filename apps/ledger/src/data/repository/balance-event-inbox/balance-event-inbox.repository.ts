import { InjectDataSource } from '@nestjs/typeorm'
import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { LedgerPostgresConfig } from '../../data-source/postgres/ledger-postgres.config'
import { BalanceEventInboxEntity } from '../../data-source/postgres/entities/balance-event-inbox.entity'
import { TxContext } from '@app/shared/types/tx-context.type'

@Injectable()
export class BalanceEventInboxRepository {
  constructor(@InjectDataSource(LedgerPostgresConfig.DATASOURCE_NAME) private readonly datasource: DataSource) {}

  async exists(key: string): Promise<boolean> {
    return this.datasource.manager.exists(BalanceEventInboxEntity, { where: { key } })
  }

  async create(key: string, ctx: TxContext): Promise<void> {
    await ctx.em.save(BalanceEventInboxEntity, { key })
  }
}
