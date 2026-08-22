import { plainToClass } from 'class-transformer'
import { IsEnum, IsNumber, IsString, IsOptional, validateSync, Min, Max, IsInt, IsPositive } from 'class-validator'
import { TransformBoolean, TransformStringArray, TransformNumber, TransformJsonStringMap } from '@app/env'

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

  @IsString()
  @IsOptional()
  readonly SERVICE_NAME: string = 'integration'

  @TransformJsonStringMap()
  readonly SECURE_SIGNATURE_SECRETS: ReadonlyMap<string, string>

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
  readonly DB_SCHEMA: string = 'integration'

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
  readonly NATS_CLIENT_NAME: string = 'integration-service'

  // Logging
  @IsString()
  @IsOptional()
  readonly LOG_LEVEL: string = 'info'

  @IsString()
  readonly CORE_GRPC_URL: string

  @TransformNumber()
  @IsInt()
  @IsPositive()
  readonly CORE_GRPC_TIMEOUT: number

  @TransformNumber()
  @IsInt()
  readonly CORE_GRPC_RETRIES: number

  @TransformBoolean()
  readonly CORE_GRPC_USE_SSL: boolean

  @TransformStringArray()
  @IsOptional()
  readonly KAFKA_BROKERS: ReadonlyArray<string> = ['localhost:19092']

  @IsString()
  readonly KAFKA_CLIENT_ID: string = 'integration-service'
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
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
