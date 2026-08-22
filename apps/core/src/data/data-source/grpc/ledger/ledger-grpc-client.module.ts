import { Module } from '@nestjs/common'
import { LedgerGrpcClient } from './ledger-grpc-client'
import { LedgerGrpcConfig, LedgerGrpcConfigModule } from '../../../../config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { LEDGER_PACKAGE_NAME } from '@app/shared/services/ledger/v1/grpc/generated/ledger'
import { fromRoot } from '@app/utils'

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: 'LEDGER_PACKAGE',
          imports: [LedgerGrpcConfigModule],
          inject: [LedgerGrpcConfig],
          useFactory: (grpcConfig: LedgerGrpcConfig) => ({
            transport: Transport.GRPC,
            options: {
              package: LEDGER_PACKAGE_NAME,
              protoPath: fromRoot('libs/shared/src/services/ledger/v1/grpc/ledger.proto'),
              url: grpcConfig.url,
            },
          }),
        },
      ],
    }),
  ],
  providers: [LedgerGrpcClient],
  exports: [LedgerGrpcClient],
})
export class LedgerGrpcClientModule {}
