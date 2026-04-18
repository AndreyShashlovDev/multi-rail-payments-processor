import { Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { APP_SCHEMA } from '../core-postgres.config'
import { Id, IntegrationAccount, IntegrationCurrency } from '@app/types'
import { BasicEntity } from '@app/database'
import type { TransactionModel } from '../../../../shared/model/transaction.model'
import { IntegrationEntityType, TransactionStatus } from '@app/shared'
import { PaymentInboxTransferKey } from '../../../../module/payment-intent/model/payment-inbox-transfer.model'

export enum PaymentInboxTransferEntityState {
  CREATED = 1,
  BLOCKED = 2,
}

@Entity({ schema: APP_SCHEMA, name: PaymentInboxTransferEntity.NAME })
@Unique('idx_unique_integration_txid_transferid_txstatus', [...PaymentInboxTransferEntity.UNIQUE])
export class PaymentInboxTransferEntity extends BasicEntity {
  static readonly NAME = 'payment_inbox_transfer'
  static readonly PATH = `"${APP_SCHEMA}".${PaymentInboxTransferEntity.NAME}`
  static readonly UNIQUE: ReadonlyArray<keyof PaymentInboxTransferEntity> = [
    'integration',
    'txId',
    'transferId',
    'txStatus',
  ]

  @PrimaryGeneratedColumn({ type: 'bigint' })
  readonly id: Id

  @Column({ type: 'text' })
  readonly key: PaymentInboxTransferKey

  @Column({ type: 'bigint' })
  readonly txId: Id

  @Column({ type: 'bigint' })
  readonly transferId: Id

  @Column({ type: 'smallint' })
  readonly integration: IntegrationEntityType

  @Column({ type: 'text' })
  readonly to: IntegrationAccount

  @Column({ type: 'text' })
  readonly currency: IntegrationCurrency

  @Column({ type: 'text' })
  readonly txStatus: TransactionStatus

  @Column({ type: 'json' })
  readonly data: TransactionModel

  @Column({ type: 'smallint' })
  readonly state: PaymentInboxTransferEntityState

  @Column({ type: 'text', nullable: true })
  readonly reason?: string | null

  @DeleteDateColumn()
  readonly deletedAt?: Date
}
