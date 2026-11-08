import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator'
import type { IntegrationCurrency } from '@app/types'

// What a completed step (transfer route) produced. A new kind of step adds a new result type
// (e.g. BRIDGE_DEPOSIT with a depositId, SWAP with the received amount) and the orchestrator
// uses it when it resolves the next step (TransferRoutePlanner.resolveNext).
export enum TransferRouteResultType {
  TRANSFER = 'TRANSFER',
}

export abstract class TransferRouteResultBase {
  @IsEnum(TransferRouteResultType)
  readonly type: TransferRouteResultType
}

export class TransferRouteTransferResult extends TransferRouteResultBase {
  override readonly type: TransferRouteResultType.TRANSFER = TransferRouteResultType.TRANSFER

  // amount actually transferred, in the smallest units
  @IsNumberString()
  readonly rawAmount: string

  @IsString()
  readonly currency: IntegrationCurrency

  @IsNumberString()
  @IsOptional()
  readonly fee: string | null

  @IsString()
  readonly feeCurrency: IntegrationCurrency

  constructor(rawAmount: string, currency: IntegrationCurrency, fee: string | null, feeCurrency: IntegrationCurrency) {
    super()
    this.rawAmount = rawAmount
    this.currency = currency
    this.fee = fee
    this.feeCurrency = feeCurrency
  }
}

export type TransferRouteResult = TransferRouteTransferResult

// class-transformer discriminator: picks the result class by `type`
export const TRANSFER_ROUTE_RESULT_SUBTYPES = {
  property: 'type',
  subTypes: [{ value: TransferRouteTransferResult, name: TransferRouteResultType.TRANSFER }],
}
