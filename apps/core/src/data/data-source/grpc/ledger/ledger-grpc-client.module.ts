import { Module } from '@nestjs/common'
import { LedgerGrpcClient } from './ledger-grpc-client'
import { ConfigService } from '@nestjs/config'
import { AppRootConfig } from '../../../../config/app-root-config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { LEDGER_PACKAGE_NAME } from '@app/shared/services/ledger/v1/grpc/generated/ledger'
import { LedgerGrpcConfig } from '../../../../config/ledger.grpc.config'
import { fromRoot } from '@app/utils'

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: 'LEDGER_PACKAGE',
          inject: [ConfigService],
          useFactory: (config: ConfigService<AppRootConfig>) => ({
            transport: Transport.GRPC,
            options: {
              package: LEDGER_PACKAGE_NAME,
              protoPath: fromRoot('libs/shared/src/services/ledger/v1/grpc/ledger.proto'),
              url: config.getOrThrow<LedgerGrpcConfig>('ledgerGrpc').url,
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
