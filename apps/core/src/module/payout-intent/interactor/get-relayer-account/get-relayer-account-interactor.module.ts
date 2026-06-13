import { Module } from '@nestjs/common'
import { GetRelayerAccountInteractor } from './get-relayer-account.interactor'
import { CurrencyRepositoryModule } from '../../../../data/repository/currency/currency-repository.module'
import { RelayerRepositoryModule } from '../../../../data/repository/relayer/relayer-repository.module'
import { IntegrationAccountRepositoryModule } from '../../../../data/repository/integration-account/integration-account-repository.module'

@Module({
  imports: [CurrencyRepositoryModule, RelayerRepositoryModule, IntegrationAccountRepositoryModule],
  providers: [GetRelayerAccountInteractor],
  exports: [GetRelayerAccountInteractor],
})
export class GetRelayerAccountInteractorModule {}
