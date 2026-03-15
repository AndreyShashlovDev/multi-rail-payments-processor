import { CreateDateColumn, UpdateDateColumn } from 'typeorm'

export class BasicEntity {
  @CreateDateColumn()
  readonly createdAt: Date

  @UpdateDateColumn()
  readonly updatedAt: Date
}
