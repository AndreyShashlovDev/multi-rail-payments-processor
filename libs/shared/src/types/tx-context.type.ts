import { EntityManager, DataSource } from 'typeorm'

export type TxContext = {
  em: EntityManager
  source: DataSource
}
