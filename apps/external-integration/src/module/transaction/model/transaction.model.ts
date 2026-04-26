import { EvmHashType, Id, IntegrationCurrency, RawNumeric } from '@app/types'
import { SourceTransactionId } from '@app/types/source-transaction-id.type'
import { TransferModel, TransferData } from './transfer.model'
import { IntegrationType, integrationTypeFromDomain, IntegrationEntityType, TransactionStatus } from '@app/shared'

export interface EthereumMetadata {
  readonly blockHash: EvmHashType
  readonly txIndex: number
  readonly txFee: RawNumeric
  readonly gasPrice: RawNumeric
  readonly gasUsed: RawNumeric
  readonly ver: number
}

export interface PolygonMetadata extends EthereumMetadata {}

export type IntegrationMetadataModelMap = {
  [IntegrationType.INTERNAL]: {}
  [IntegrationType.ETHEREUM]: EthereumMetadata
  [IntegrationType.POLYGON]: PolygonMetadata
}

export type TransactionMetadata = EthereumMetadata | PolygonMetadata
export type TransactionBlockId = string

export interface TransactionData {
  readonly integration: IntegrationType
  readonly sourceTxId: SourceTransactionId
  readonly blockId: TransactionBlockId | null
  readonly blockTime: Date | null
  readonly status: TransactionStatus
  readonly metadata: TransactionMetadata | null
  readonly transfers: ReadonlyArray<TransferData>
  readonly fee: RawNumeric | null
  readonly feeCurrency: IntegrationCurrency
  readonly raw: string | null
}

export interface TransactionModel extends Omit<TransactionData, 'transfers'> {
  readonly id: Id
  readonly transfers: ReadonlyArray<TransferModel>
}

export function getTransactionTypedMetadata<T extends IntegrationType>(
  type: T,
  metadata: TransactionMetadata,
): IntegrationMetadataModelMap[T] {
  const integrationEntityType = integrationTypeFromDomain(type)

  switch (integrationEntityType) {
    case IntegrationEntityType.INTERNAL:
      return metadata

    case IntegrationEntityType.ETHEREUM:
      return metadata

    case IntegrationEntityType.POLYGON:
      return metadata

    default: {
      const _exhaustive: never = integrationEntityType

      throw new Error(`Unhandled integration type for metadata: ${String(_exhaustive)}`)
    }
  }
}
