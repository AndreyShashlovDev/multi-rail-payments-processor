import { IsString, IsInt, IsOptional } from 'class-validator'

export class BasicEvent {
  @IsString()
  readonly uniqueKey: string

  @IsInt()
  readonly ver: number

  /**
   * signature for check data of event with sign of service
   */
  @IsString()
  @IsOptional()
  readonly signature: string | null

  constructor(uniqueKey: string, ver: number, signature: string | null) {
    this.uniqueKey = uniqueKey
    this.ver = ver
    this.signature = signature
  }
}
