export class AppConfig {
  constructor(
    readonly name: string,
    readonly nodeEnv: string,
    readonly http: {
      readonly port: number
    },
    readonly secure: {
      readonly signatureSecrets: ReadonlyMap<string, string>
    },
  ) {}
}
