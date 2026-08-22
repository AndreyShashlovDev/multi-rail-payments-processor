import { Module, FactoryProvider } from '@nestjs/common'
import { SignatureService } from '@app/shared/signature/signature.service'
import { AppConfig, AppConfigModule } from '../../config'

const Provider: FactoryProvider = {
  provide: SignatureService,
  inject: [AppConfig],
  useFactory: (appConfig: AppConfig) => new SignatureService(appConfig.name, appConfig.secure.signatureSecrets),
}

@Module({
  imports: [AppConfigModule],
  providers: [Provider],
  exports: [Provider],
})
export class SignatureServiceModule {}
