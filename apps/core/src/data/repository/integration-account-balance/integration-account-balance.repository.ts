import { UpdateBalanceData } from './integration-account-balance-repository.types'
import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'
import { IntegrationAccountBalanceEntity } from '../../data-source/postgres/entities/integration-account-balance.entity'
import { integrationTypeFromDomain } from '@app/shared'

export class IntegrationAccountBalanceRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async upsertBalances(data: UpdateBalanceData): Promise<void> {
    const { projections, updatedAt } = data

    if (projections.length === 0) return

    const params: unknown[] = []
    const valueParts: string[] = []

    for (const projection of data.projections) {
      params.push(integrationTypeFromDomain(projection.integration), projection.account, projection.currency)
      const base = params.length - 3
      valueParts.push(`($${base + 1}::smallint, $${base + 2}, $${base + 3}, ` + `${projection.available.toFixed()})`)
    }

    params.push(updatedAt)
    const dateParam = `$${params.length}`

    await this.datasource.manager.query(
      `INSERT INTO ${IntegrationAccountBalanceEntity.PATH}
       (integration, account, currency, available)
     VALUES ${valueParts.join(', ')}
     ON CONFLICT (integration, account, currency)
     DO UPDATE SET
       available  = EXCLUDED.available,
       updated_at = now()
     WHERE ${IntegrationAccountBalanceEntity.PATH}.updated_at < ${dateParam}`,
      params,
    )
  }
}
