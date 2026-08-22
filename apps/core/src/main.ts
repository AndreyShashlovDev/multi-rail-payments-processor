import { NestFactory } from '@nestjs/core'
import { AppModule } from './application/app.module'
import { AppConfig, GrpcConfig } from './config'
import { Logger } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { fromRoot } from '@app/utils'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule)

  const grpcConfig = app.get(GrpcConfig)

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'core',
      protoPath: fromRoot('libs/shared/src/services/core/v1/grpc/core.proto'),
      url: `${grpcConfig.host}:${grpcConfig.port}`,
      loader: {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  })

  await app.startAllMicroservices()

  const httpPort = app.get(AppConfig).http.port
  await app.listen(httpPort)
  logger.log(`HTTP server listening on port ${httpPort}`)
}

bootstrap().catch((e) => {
  throw e
})
