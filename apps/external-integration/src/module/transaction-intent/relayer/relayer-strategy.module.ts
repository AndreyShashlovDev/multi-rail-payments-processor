import { Module, FactoryProvider } from '@nestjs/common'
import { RelayerRepositoryModule } from '../../../data/repository/relayer/relayer-repository.module'
import { RelayerStrategy } from './relayer.strategy'
import { RelayerRepository } from '../../../data/repository/relayer/relayer.repository'
import { PlatformRelayer } from './relayer/platform.relayer'

const Provider: FactoryProvider = {
  provide: RelayerStrategy,
  inject: [RelayerRepository],
  useFactory: (relayerRepository: RelayerRepository) => {
    const platformRelayer = new PlatformRelayer(relayerRepository)

    return new RelayerStrategy(new Set([platformRelayer]))
  },
}

@Module({
  imports: [RelayerRepositoryModule],
  providers: [Provider],
  exports: [Provider],
})
export class RelayerStrategyModule {}
