import { Module } from '@nestjs/common'
import { CoreGrpcClient } from './core-grpc-client'
import { CoreGrpcConfig, CoreGrpcConfigModule } from '../../../../config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { fromRoot } from '@app/utils'
import { CORE_PACKAGE_NAME } from '@app/shared/services/core/v1/grpc/generated/core'
import { GRPC_CORE_CLIENT } from './grpc-core-client.type'

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: GRPC_CORE_CLIENT,
          imports: [CoreGrpcConfigModule],
          inject: [CoreGrpcConfig],
          useFactory: (coreGrpcConfig: CoreGrpcConfig) => ({
            transport: Transport.GRPC,
            options: {
              package: CORE_PACKAGE_NAME,
              protoPath: fromRoot('libs/shared/src/services/core/v1/grpc/core.proto'),
              url: coreGrpcConfig.url,
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
