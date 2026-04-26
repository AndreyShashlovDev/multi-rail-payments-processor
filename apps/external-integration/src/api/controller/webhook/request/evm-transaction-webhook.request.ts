import { IsEnum, IsNumberString, IsEthereumAddress, IsHexadecimal, IsNumber, IsInt } from 'class-validator'
import type { EvmAddress, EvmHashType, RawNumeric } from '@app/types'

export enum TransactionWebhookStatus {
  ACCEPTED = 'ACCEPTED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REORG = 'REORG',
}

export type EvmBlockchain = 'ethereum'
const SupportedEvmBlockchains: EvmBlockchain[] = ['ethereum'] as const

export class EvmTransactionWebhookRequest {
  @IsEnum(SupportedEvmBlockchains)
  readonly chain: EvmBlockchain

  @IsInt()
  readonly index: number

  @IsEthereumAddress()
  readonly from: EvmAddress

  @IsEthereumAddress()
  readonly to: EvmAddress

  @IsNumberString({ no_symbols: true }) // bigint validator
  readonly amount: RawNumeric

  @IsEnum(TransactionWebhookStatus)
  readonly status: TransactionWebhookStatus

  @IsNumberString({ no_symbols: true })
  readonly blockNumber: RawNumeric

  @IsHexadecimal()
  readonly blockHash: EvmHashType

  @IsHexadecimal()
  readonly hash: EvmHashType

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  readonly timestamp: number

  constructor(
    chain: EvmBlockchain,
    index: number,
    from: EvmAddress,
    to: EvmAddress,
    amount: RawNumeric,
    status: TransactionWebhookStatus,
    blockNumber: RawNumeric,
    blockHash: EvmHashType,
    hash: EvmHashType,
    timestamp: number,
  ) {
    this.chain = chain
    this.index = index
    this.from = from
    this.to = to
    this.amount = amount
    this.status = status
    this.blockNumber = blockNumber
    this.blockHash = blockHash
    this.hash = hash
    this.timestamp = timestamp
  }
}
