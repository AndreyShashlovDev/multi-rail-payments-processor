import { IsString, IsInt } from 'class-validator'

export class BasicEvent {
  @IsString()
  readonly uniqueKey: string

  @IsInt()
  readonly ver: number

  constructor(uniqueKey: string, ver: number) {
    this.uniqueKey = uniqueKey
    this.ver = ver
  }
}
