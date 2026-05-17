import { Module } from '@nestjs/common'
import { GetRelayerAccountInteractor } from './get-relayer-account.interactor'
import { CurrencyRepositoryModule } from '../../../../data/repository/currency/currency-repository.module'
import { RelayerRepositoryModule } from '../../../../data/repository/relayer/relayer-repository.module'

@Module({
  imports: [CurrencyRepositoryModule, RelayerRepositoryModule],
  providers: [GetRelayerAccountInteractor],
  exports: [GetRelayerAccountInteractor],
})
export class GetRelayerAccountInteractorModule {}
