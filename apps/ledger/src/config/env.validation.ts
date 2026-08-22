import { plainToClass } from 'class-transformer'
import { IsEnum, IsNumber, IsString, IsOptional, validateSync, Min, Max } from 'class-validator'
import { TransformBoolean, TransformNumber, TransformJsonStringMap } from '@app/env'

export enum Environment {
  development = 'development',
  production = 'production',
  test = 'test',
}

export class EnvironmentVariables {
  // App
  @IsEnum(Environment)
  @IsOptional()
  readonly NODE_ENV: Environment = Environment.development

  @TransformJsonStringMap()
  readonly SECURE_SIGNATURE_SECRETS: ReadonlyMap<string, string>

  @IsString()
  @IsOptional()
  readonly SERVICE_NAME: string = 'ledger'

  @TransformNumber()
  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  readonly HTTP_PORT: number = 3003

  // Database
  @IsString()
  @IsOptional()
  readonly DB_HOST: string = 'localhost'

  @TransformNumber()
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
  readonly DB_SCHEMA: string = 'ledger'

  @TransformBoolean()
  @IsOptional()
  readonly DB_SSL: boolean = false

  @TransformBoolean()
  @IsOptional()
  readonly DB_LOGGING: boolean = false

  // NATS
  @IsString()
  @IsOptional()
  readonly NATS_URL: string = 'nats://localhost:4222'

  @IsString()
  @IsOptional()
  readonly NATS_CLIENT_NAME: string = 'ledger-service'

  // gRPC
  @IsString()
  @IsOptional()
  readonly GRPC_HOST: string = '0.0.0.0'

  @TransformNumber()
  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  readonly GRPC_PORT: number = 50051

  @TransformNumber()
  @IsNumber()
  @IsOptional()
  readonly GRPC_MAX_RECEIVE_MESSAGE_LENGTH: number = 4 * 1024 * 1024

  @TransformNumber()
  @IsNumber()
  @IsOptional()
  readonly GRPC_MAX_SEND_MESSAGE_LENGTH: number = 4 * 1024 * 1024

  // Logging
  @IsString()
  @IsOptional()
  readonly LOG_LEVEL: string = 'info'
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    // Off on purpose: with implicit conversion, an empty string ENV value silently becomes `0`
    // for numeric fields (`Number('') === 0`) instead of failing validation or falling back to
    // the default. Every field that needs parsing from a string (numbers, booleans, arrays,
    // JSON) has an explicit @TransformXxx() decorator from @app/env instead.
    enableImplicitConversion: false,
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }

  return validatedConfig
}
