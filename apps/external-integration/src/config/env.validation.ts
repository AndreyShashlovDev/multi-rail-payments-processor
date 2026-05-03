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
  IsJSON,
  IsNotEmpty,
} from 'class-validator'

export enum Environment {
  development = 'development',
  production = 'production',
  test = 'test',
}

class EnvironmentVariables {
  // App
  @IsEnum(Environment)
  @IsOptional()
  readonly NODE_ENV: Environment = Environment.development

  @IsString()
  @IsOptional()
  readonly SERVICE_NAME: string = 'integration'

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
  readonly DB_SCHEMA: string = 'integration'

  @IsBoolean()
  @IsOptional()
  readonly DB_SSL: boolean = false

  @IsBoolean()
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
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
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
