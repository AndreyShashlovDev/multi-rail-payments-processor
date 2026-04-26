import { Module } from '@nestjs/common'
import { ExternalIntegrationEventListener } from './external-integration-event.listener'
import { ExternalIntegrationConsumerModule } from '../../../../data/consumer/external-integration/external-integration-consumer.module'
import { PayoutInboxTransferRepositoryModule } from '../../../../data/repository/payout-inbox-transfer/payout-inbox-transfer-repository.module'
import { ProcessPayoutTransactionInteractorModule } from '../../interactor/process-payout-transaction/process-payout-transaction-interactor.module'

@Module({
  imports: [
    ExternalIntegrationConsumerModule,
    PayoutInboxTransferRepositoryModule,
    ProcessPayoutTransactionInteractorModule,
  ],
  providers: [ExternalIntegrationEventListener],
})
export class ExternalIntegrationEventListenerModule {}
