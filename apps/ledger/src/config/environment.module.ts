import { Module } from '@nestjs/common'
import Dotenv from 'dotenv'
import { EnvironmentVariables, validate } from './env.validation'

Dotenv.config({ path: ['.env', '.env.sample'] })

@Module({
  providers: [
    {
      provide: EnvironmentVariables,
      useFactory: () => validate(process.env),
    },
  ],
  exports: [EnvironmentVariables],
})
export class EnvironmentModule {}
