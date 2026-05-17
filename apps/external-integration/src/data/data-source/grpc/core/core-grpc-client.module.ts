import { Module } from '@nestjs/common'
import { CoreGrpcClient } from './core-grpc-client'
import { ConfigService } from '@nestjs/config'
import { AppRootConfig } from '../../../../config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { fromRoot } from '@app/utils'
import { CORE_PACKAGE_NAME } from '@app/shared/services/core/v1/grpc/generated/core'
import { CoreGrpcConfig } from '../../../../config'
import { GRPC_CORE_CLIENT } from './grpc-core-client.type'

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: GRPC_CORE_CLIENT,
          inject: [ConfigService],
          useFactory: (config: ConfigService<AppRootConfig>) => ({
            transport: Transport.GRPC,
            options: {
              package: CORE_PACKAGE_NAME,
              protoPath: fromRoot('libs/shared/src/services/core/v1/grpc/core.proto'),
              url: config.getOrThrow<CoreGrpcConfig>('coreGrpc').url,
            },
          }),
        },
      ],
    }),
  ],
  providers: [CoreGrpcClient],
  exports: [CoreGrpcClient],
})
export class CoreGrpcClientModule {}
