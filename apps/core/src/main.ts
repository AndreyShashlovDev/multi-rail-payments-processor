import { NestFactory } from '@nestjs/core'
import { AppModule } from './application/app.module'
import { ConfigService } from '@nestjs/config'
import { AppRootConfig } from './config/app-root-config'
import { AppConfig } from './config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService<AppRootConfig>)
  const appConfig = config.getOrThrow<AppConfig>('app')

  await app.listen(appConfig.http.port)
}

bootstrap().catch((e) => {
  throw e
})
