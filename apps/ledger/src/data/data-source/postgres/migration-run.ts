import 'reflect-metadata'
import dataSource, { APP_SCHEMA } from './ledger-postgres.config'

async function runMigrations(): Promise<void> {
  await dataSource.initialize()

  await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${APP_SCHEMA}"`)

  await dataSource.runMigrations({ transaction: 'all' })

  await dataSource.destroy()
}

runMigrations()
  .then(() => {
    console.log('✅ Migrations completed')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  })
