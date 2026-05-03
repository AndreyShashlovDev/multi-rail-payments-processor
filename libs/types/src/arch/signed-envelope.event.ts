import { Expose, Type } from 'class-transformer'
import { IsInt, IsHexadecimal, Length, ValidateNested, IsString } from 'class-validator'

export class SignedEnvelopeMeta<T> {
  @Expose()
  @IsString()
  readonly service: string

  @Expose()
  @IsInt()
  readonly timestamp: number

  @Expose()
  readonly payload: Readonly<T>

  constructor(service: string, timestamp: number, payload: T) {
    this.service = service
    this.timestamp = timestamp
    this.payload = payload
  }
}

export class SignedEnvelopeEvent<T> {
  @Expose()
  @ValidateNested()
  @Type(() => SignedEnvelopeMeta)
  readonly meta: SignedEnvelopeMeta<T>

  @Expose()
  @IsHexadecimal()
  @Length(64, 64)
  readonly sig: string

  constructor(meta: SignedEnvelopeMeta<T>, sig: string) {
    this.meta = meta
    this.sig = sig
  }
}
