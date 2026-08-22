import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './application/app.module'
import { AppConfig } from './config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const appConfig = app.get(AppConfig)

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

bootstrap().catch((e) => {
  throw e
})
