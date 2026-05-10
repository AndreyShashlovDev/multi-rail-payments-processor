import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { Injectable } from '@nestjs/common'
import { CqrsQuery, CqrsCommand } from '@app/types'

@Injectable()
export class CqrsDataSource {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async makeQuery<T>(query: CqrsQuery<T>): Promise<T> {
    return await this.queryBus.execute(query)
  }

  async callCommand<T>(command: CqrsCommand<T>): Promise<T> {
    return await this.commandBus.execute(command)
  }
}
