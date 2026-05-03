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
  IsJSON,
  IsNotEmpty,
} from 'class-validator'

export enum Environment {
  development = 'development',
  production = 'production',
  test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  readonly NODE_ENV: Environment = Environment.development

  @IsString()
  @IsOptional()
  readonly SERVICE_NAME: string = 'core'

  @IsJSON()
  @IsNotEmpty()
  readonly SECURE_SIGNATURE_SECRETS: Record<string, string>

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  readonly HTTP_PORT: number = 3003

  // Database
  @IsString()
  @IsOptional()
  readonly DB_HOST: string = 'localhost'

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  readonly DB_PORT: number = 5432

  @IsString()
  @IsOptional()
  readonly DB_USERNAME: string = 'postgres'

  @IsString()
  @IsOptional()
  readonly DB_PASSWORD: string = 'postgres'

  @IsString()
  @IsOptional()
  readonly DB_DATABASE: string = 'eventsourcing'

  @IsString()
  @IsOptional()
  readonly DB_SCHEMA: string = 'core'

  @IsBoolean()
  @IsOptional()
  readonly DB_SSL: boolean = false

  @IsBoolean()
  @IsOptional()
  readonly DB_LOGGING: boolean = false

  // NATS
  @IsString()
  readonly NATS_URL: string

  @IsString()
  readonly NATS_CLIENT_NAME: string

  // gRPC
  @IsString()
  @IsOptional()
  readonly GRPC_HOST: string = '0.0.0.0'

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  readonly GRPC_PORT: number = 50051

  @IsNumber()
  @IsOptional()
  readonly GRPC_MAX_RECEIVE_MESSAGE_LENGTH: number = 4 * 1024 * 1024

  @IsNumber()
  @IsOptional()
  readonly GRPC_MAX_SEND_MESSAGE_LENGTH: number = 4 * 1024 * 1024

  @IsString()
  @IsOptional()
  readonly LOG_LEVEL: string = 'info'

  @IsString()
  readonly LEDGER_GRPC_URL: string

  @IsInt()
  @IsPositive()
  readonly LEDGER_GRPC_TIMEOUT: number

  @IsInt()
  readonly LEDGER_GRPC_RETRIES: number

  @IsBoolean()
  readonly LEDGER_GRPC_USE_SSL: boolean
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
