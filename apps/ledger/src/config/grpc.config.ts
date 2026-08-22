export class GrpcConfig {
  constructor(
    readonly host: string,
    readonly port: number,
    readonly maxReceiveMessageLength: number,
    readonly maxSendMessageLength: number,
  ) {}
}
