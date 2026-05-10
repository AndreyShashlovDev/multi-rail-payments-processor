import { IntegrationType, TxContext, integrationTypeFromDomain } from '@app/shared'
import { APP_SCHEMA } from '../../data-source/postgres/integration-postgres.config'
import { InternalBlockEntity } from '../../data-source/postgres/entities/internal-block.entity'
import { SourceTransactionId } from '@app/types'

export class InternalBlockRepository {
  async incrementAndGet(integration: IntegrationType, ctx: TxContext): Promise<SourceTransactionId> {
    const [result] = await ctx.em.query<[{ block_number: SourceTransactionId }]>(
      `INSERT INTO ${APP_SCHEMA}.${InternalBlockEntity.NAME} (integration, block_number)
       VALUES ($1, 1) ON CONFLICT (integration)
           DO
      UPDATE SET block_number = internal_block.block_number + 1
        RETURNING block_number`,
      [integrationTypeFromDomain(integration)],
    )

    return result.block_number
  }
}
