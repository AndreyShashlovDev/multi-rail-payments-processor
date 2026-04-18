import { Column, Entity, PrimaryGeneratedColumn, Unique, DeleteDateColumn } from 'typeorm'
import { APP_SCHEMA } from '../core-postgres.config'
import type { Id, UUID } from '@app/types'
import { BasicEntity } from '@app/database'
import type { TransactionModel } from '../../../../shared/model/transaction.model'
import { TransactionStatus, IntegrationEntityType } from '@app/shared'
import type { PayoutInboxTransferKey } from '../../../../module/payout-intent/model/payout-inbox-transfer.model'

export enum PayoutInboxTransferEntityState {
  CREATED = 1,
  BLOCKED = 2,
}

@Entity({ schema: APP_SCHEMA, name: PayoutInboxTransferEntity.NAME })
@Unique('idx_unique_integration_intentid_txid_transferid_txstatus', [...PayoutInboxTransferEntity.UNIQUE])
export class PayoutInboxTransferEntity extends BasicEntity {
  static readonly NAME = 'payout_inbox_transfer'
  static readonly PATH = `"${APP_SCHEMA}".${PayoutInboxTransferEntity.NAME}`
  static readonly UNIQUE: ReadonlyArray<keyof PayoutInboxTransferEntity> = [
    'integration',
    'intentId',
    'txId',
    'transferId',
    'txStatus',
  ]

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'text' })
  readonly key: PayoutInboxTransferKey

  @Column({ type: 'bigint' })
  readonly txId: Id

  @Column({ type: 'bigint' })
  readonly transferId: Id

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'uuid' })
  readonly intentId: UUID

  @Column({ type: 'text' })
  readonly txStatus: TransactionStatus

  @Column({ type: 'json' })
  readonly data: TransactionModel

  @Column({ type: 'smallint' })
  readonly state: PayoutInboxTransferEntityState

  @Column({ type: 'text', nullable: true })
  readonly reason?: string | null

  @DeleteDateColumn()
  readonly deletedAt?: Date
}
