export class PostgresConfig {
  constructor(
    readonly host: string,
    readonly port: number,
    readonly username: string,
    readonly password: string,
    readonly database: string,
    readonly schema: string,
    readonly ssl: boolean,
    readonly logging: boolean,
    readonly extra?: Record<string, unknown>,
  ) {}
}
