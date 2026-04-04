import { AccountEntity, AccountEntityRole } from '../../data-source/postgres/entities/account.entity'
import { AccountModel, AccountRole } from '../../../shared/model/account.model'

export class AccountRepositoryMapper {
  static toDomain(entity: AccountEntity): AccountModel {
    return {
      ...entity, // fixme remove it. need clear mapping
      role: AccountRepositoryMapper.toDomainRole(entity.role),
    }
  }

  static toDomainRole(role: AccountEntityRole): AccountRole {
    switch (role) {
      case AccountEntityRole.PLATFORM:
        return AccountRole.PLATFORM
      case AccountEntityRole.MERCHANT:
        return AccountRole.MERCHANT

      default: {
        const exhaustive: never = role
        throw new Error(`Unknown account role: ${String(exhaustive)}`)
      }
    }
  }
}
