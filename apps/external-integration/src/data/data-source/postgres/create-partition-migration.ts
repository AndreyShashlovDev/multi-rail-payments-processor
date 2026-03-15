import { QueryRunner } from 'typeorm'
import { APP_SCHEMA } from './integration-postgres.config'
import { IntegrationType } from '@app/shared'

export const TRANSACTION_TABLE = `"${APP_SCHEMA}"."transaction"`

export function createPartitionMigration(type: IntegrationType) {
  const partitionTable = `"${APP_SCHEMA}"."transaction_${type.toLowerCase()}"`
  const value = type.toUpperCase()

  return {
    async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        CREATE TABLE ${partitionTable}
          PARTITION OF ${TRANSACTION_TABLE}
          FOR VALUES IN
        ('${value}')
      `)

      await queryRunner.query(`
        CREATE INDEX "idx_transaction_${type.toLowerCase()}_block_id"
          ON ${partitionTable} ("block_id")
      `)
    },

    async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP TABLE IF EXISTS ${partitionTable}`)
    },
  }
}
