import { plainToClass } from 'class-transformer'
import {
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  validateSync,
  Min,
  Max,
  IsInt,
  IsPositive,
} from 'class-validator'

export enum Environment {
  development = 'development',
  production = 'production',
  test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.development

  @IsString()
  @IsOptional()
  SERVICE_NAME: string = 'core'

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  HTTP_PORT: number = 3003

  // Database
  @IsString()
  @IsOptional()
  DB_HOST: string = 'localhost'

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  DB_PORT: number = 5432

  @IsString()
  @IsOptional()
  DB_USERNAME: string = 'postgres'

  @IsString()
  @IsOptional()
  DB_PASSWORD: string = 'postgres'

  @IsString()
  @IsOptional()
  DB_DATABASE: string = 'eventsourcing'

  @IsString()
  @IsOptional()
  DB_SCHEMA: string = 'core'

  @IsBoolean()
  @IsOptional()
  DB_SSL: boolean = false

  @IsBoolean()
  @IsOptional()
  DB_LOGGING: boolean = false

  // NATS
  @IsString()
  NATS_URL: string

  @IsString()
  NATS_CLIENT_NAME: string

  // gRPC
  @IsString()
  @IsOptional()
  GRPC_HOST: string = '0.0.0.0'

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  GRPC_PORT: number = 50051

  @IsNumber()
  @IsOptional()
  GRPC_MAX_RECEIVE_MESSAGE_LENGTH: number = 4 * 1024 * 1024

  @IsNumber()
  @IsOptional()
  GRPC_MAX_SEND_MESSAGE_LENGTH: number = 4 * 1024 * 1024

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info'

  @IsString()
  LEDGER_GRPC_URL: string

  @IsInt()
  @IsPositive()
  LEDGER_GRPC_TIMEOUT: number

  @IsInt()
  LEDGER_GRPC_RETRIES: number

  @IsBoolean()
  LEDGER_GRPC_USE_SSL: boolean
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }

  return validatedConfig
}
