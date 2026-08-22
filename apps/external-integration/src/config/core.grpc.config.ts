export class CoreGrpcConfig {
  constructor(
    readonly url: string,
    readonly timeout: number,
    readonly retries: number,
    readonly useSSL: boolean,
  ) {}
}
