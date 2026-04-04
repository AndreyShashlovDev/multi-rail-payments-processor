import { Injectable } from '@nestjs/common'
import { TxContext } from '@app/shared/types/tx-context.type'
import { InboxEntity } from '../../data-source/postgres/entities/inbox.entity'
import { CreateInboxData } from './inbox-repository.types'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'

@Injectable()
export class InboxRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async create(data: CreateInboxData, ctx?: TxContext): Promise<boolean> {
    const em = ctx?.em ?? this.datasource.manager

    try {
      await em.insert(InboxEntity, em.create(InboxEntity, data))
      return true
    } catch {
      // ignore error
    }

    return false
  }
}
