import { AbstractInteractor } from '@app/types'
import { Injectable } from '@nestjs/common'
import { BalanceUpdatedResult } from '../../../data/repository/ledger/ledger-repository.types'
import { EscrowRepository } from '../../../data/repository/escrow/escrow.repository'
import { EscrowType } from '../model/escrow.model'
import { BalanceChange, BalanceChangeReason } from '@app/shared/types/balance-change'
import { BalanceChangeType, TxContextRunner } from '@app/shared'
import { UnknownEscrowTypeException } from '../exception/unknown-escrow-type.exception'
import { InboxRepository } from '../../../data/repository/inbox/inbox.repository'

export interface CreateEscrowParams {
  readonly data: BalanceUpdatedResult
}

@Injectable()
export class CreateEscrowInteractor extends AbstractInteractor<CreateEscrowParams, Promise<void>> {
  constructor(
    private readonly txContextRunner: TxContextRunner,
    private readonly escrowRepository: EscrowRepository,
    private readonly inboxRepository: InboxRepository,
  ) {
    super()
  }

  async execute(params: CreateEscrowParams): Promise<void> {
    await this.txContextRunner
      .create()
      .pipeline(async (ctx) => {
        if (
          !(await this.inboxRepository.create(
            { serviceName: CreateEscrowInteractor.name, idempotencyKey: params.data.idempotencyKey },
            ctx,
          ))
        ) {
          return
        }

        for (const change of params.data.changes) {
          if (change.type === BalanceChangeType.RELEASE_HOLD_IN || change.type === BalanceChangeType.RELEASE_HOLD) {
            await this.escrowRepository.markAsResolved({ metadataHash: this.generateMetadataHash(change) }, ctx)
          } else {
            await this.escrowRepository.create(
              {
                ...change,
                type: this.getEscrowType(change),
                intentType: change.intentType ?? null,
                intentId: change.intentId ?? null,
                metadata: change.metadata,
                metadataHash: this.generateMetadataHash(change),
              },
              ctx,
            )
          }
        }
      })
      .execute()
  }

  private getEscrowType(data: BalanceChange): EscrowType {
    if (data.type === BalanceChangeType.PLATFORM_FEE_ACCRUED) {
      return EscrowType.PLATFORM_FEE_ACCRUED
    } else if (data.metadata.reason === BalanceChangeReason.UNEXPECTED_PAYMENT) {
      return EscrowType.UNEXPECTED_PAYMENT
    } else if (data.metadata.reason === BalanceChangeReason.OVERPAY) {
      return EscrowType.OVERPAY
    } else if (data.metadata.reason === BalanceChangeReason.UNDERPAY) {
      return EscrowType.UNDERPAY
    } else if (data.metadata.reason === BalanceChangeReason.AMOUNT) {
      return EscrowType.AMOUNT
    } else if (data.metadata.reason === BalanceChangeReason.FEE) {
      return EscrowType.FEE
    } else if (data.metadata.reason === BalanceChangeReason.INTEGRATION_FEE) {
      return EscrowType.INTEGRATION_FEE
    }

    throw new UnknownEscrowTypeException(data.type, data.metadata.reason)
  }

  private generateMetadataHash(data: BalanceChange): string {
    const txId = 'txId' in data.metadata ? data.metadata.txId : ''
    const transferIds = 'transferIds' in data.metadata ? data.metadata.transferIds : []

    return [txId, transferIds.join(','), data.intentType, data.intentId].join('-')
  }
}
