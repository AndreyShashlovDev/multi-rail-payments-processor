import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './application/app.module'
import { ConfigService } from '@nestjs/config'
import { AppRootConfig } from './config/app-root-config'
import { AppConfig } from './config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config: ConfigService<AppRootConfig> = app.get(ConfigService)
  const appConfig: AppConfig = config.getOrThrow('app')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  app.enableCors()
  await app.startAllMicroservices()
  await app.listen(appConfig.http.port)
}

bootstrap()
