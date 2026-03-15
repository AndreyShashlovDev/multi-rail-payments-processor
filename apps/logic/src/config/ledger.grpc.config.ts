import { registerAs } from '@nestjs/config'

export interface LedgerGrpcConfig {
  readonly url: string
  readonly timeout: number
  readonly retries: number
  readonly useSSL: boolean
}

export default registerAs(
  'ledgerGrpc',
  (): LedgerGrpcConfig => ({
    url: process.env.LEDGER_GRPC_URL!,
    timeout: Number(process.env.LEDGER_GRPC_TIMEOUT!),
    retries: Number(process.env.LEDGER_GRPC_RETRIES!),
    useSSL: JSON.parse(process.env.LEDGER_GRPC_USE_SSL!) === true,
  }),
)
