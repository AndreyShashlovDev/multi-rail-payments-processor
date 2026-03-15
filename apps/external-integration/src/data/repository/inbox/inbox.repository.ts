import { Injectable, Logger } from '@nestjs/common'
import { TxContext } from '@app/shared/types/tx-context.type'
import { InboxEntity } from '../../data-source/postgres/entities/inbox.entity'
import { CreateInboxData } from './inbox-repository.types'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { IntegrationPostgresConfig } from '../../data-source/postgres/integration-postgres.config'

@Injectable()
export class InboxRepository {
  constructor(
    @InjectDataSource(IntegrationPostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
    private readonly logger: Logger,
  ) {}

  async create(data: CreateInboxData, ctx?: TxContext): Promise<boolean> {
    const em = ctx?.em ?? this.datasource.manager

    try {
      await em.insert(InboxEntity, em.create(InboxEntity, data))
      return true
    } catch (e) {
      this.logger.error(e)
      // ignore error
    }

    return false
  }
}
