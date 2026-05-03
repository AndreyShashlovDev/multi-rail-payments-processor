import { Injectable } from '@nestjs/common'
import { TxContext } from '@app/shared/types/tx-context.type'
import { InboxEntity } from '../../data-source/postgres/entities/inbox.entity'
import { CreateInboxData } from './inbox-repository.types'
import { QueryFailedError } from 'typeorm'
import { DatabaseError } from 'pg'

@Injectable()
export class InboxRepository {
  async create(data: CreateInboxData, ctx: TxContext): Promise<boolean> {
    try {
      await ctx.em.insert(InboxEntity, ctx.em.create(InboxEntity, data))
      return true
    } catch (e) {
      // PostgreSQL unique violation code
      if (e instanceof QueryFailedError && e.driverError instanceof DatabaseError && e.driverError.code === '23505') {
        return false
      }

      throw e
    }
  }
}
