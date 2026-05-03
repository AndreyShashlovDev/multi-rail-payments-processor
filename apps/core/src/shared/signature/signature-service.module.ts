import { Module, FactoryProvider } from '@nestjs/common'
import { SignatureService } from '@app/shared/signature/signature.service'
import { ConfigService } from '@nestjs/config'
import { AppRootConfig } from '../../config/app-root-config'
import { AppConfig } from '../../config'

const Provider: FactoryProvider = {
  provide: SignatureService,
  inject: [ConfigService],
  useFactory: (config: ConfigService<AppRootConfig>) => {
    const app = config.getOrThrow<AppConfig>('app')

    return new SignatureService(app.name, app.secure.signatureSecrets)
  },
}

@Module({
  providers: [ConfigService, Provider],
  exports: [Provider],
})
export class SignatureServiceModule {}
