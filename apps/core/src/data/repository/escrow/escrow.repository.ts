import { InjectDataSource } from '@nestjs/typeorm'
import { CorePostgresConfig } from '../../data-source/postgres/core-postgres.config'
import { DataSource } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { EscrowData, EscrowModel, EscrowStatus } from '../../../module/escrow/model/escrow.model'
import { TxContext } from '@app/shared/types/tx-context.type'
import { EscrowEntity, EscrowEntityStatus } from '../../data-source/postgres/entities/escrow.entity'
import { EscrowRepositoryMapper } from './escrow-repository.mapper'

@Injectable()
export class EscrowRepository {
  constructor(
    @InjectDataSource(CorePostgresConfig.DATASOURCE_NAME)
    private readonly datasource: DataSource,
  ) {}

  async create(data: Omit<EscrowData, 'status'>, ctx?: TxContext): Promise<EscrowModel> {
    const em = ctx?.em ?? this.datasource.manager

    const entity = EscrowRepositoryMapper.fromDomain({ ...data, status: EscrowStatus.CREATED }, em)
    const result = await em.save(EscrowEntity, entity)

    return EscrowRepositoryMapper.toDomain(result)
  }

  async markAsResolved(data: Pick<EscrowData, 'metadataHash'>, ctx?: TxContext): Promise<boolean> {
    const em = ctx?.em ?? this.datasource.manager

    const result = await em.update(
      EscrowEntity,
      { metadataHash: data.metadataHash, status: EscrowEntityStatus.CREATED },
      { status: EscrowEntityStatus.RESOLVED },
    )

    return (result.affected ?? 0) > 0
  }
}
