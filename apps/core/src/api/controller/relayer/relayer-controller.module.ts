import { Module } from '@nestjs/common'
import { GetRelayerAccountInteractorModule } from '../../../module/payout-intent/interactor/get-relayer-account/get-relayer-account-interactor.module'
import { RelayerController } from './relayer.controller'

@Module({
  imports: [GetRelayerAccountInteractorModule],
  controllers: [RelayerController],
})
export class RelayerControllerModule {}
