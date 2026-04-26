import { Module, ClassProvider, Global } from '@nestjs/common'
import { PlatformFeeProvider } from '../../shared/platform-fee/platform-fee.provider'
import { GetPlatformFeeDataOperation } from '../../module/platform-fee/operation/get-platform-fee-data-operation'
import { IntegrationAccountLinkRepositoryModule } from '../../data/repository/integration-account-link/integration-account-link-repository.module'

const Provider: ClassProvider = {
  provide: PlatformFeeProvider,
  useClass: GetPlatformFeeDataOperation,
}

@Global()
@Module({
  imports: [IntegrationAccountLinkRepositoryModule],
  providers: [Provider],
  exports: [Provider],
})
export class PlatformFeeProviderModule {}
