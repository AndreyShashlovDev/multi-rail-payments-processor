import { Module } from '@nestjs/common'
import { ExternalIntegrationEventListener } from './external-integration-event.listener'
import { ExternalIntegrationConsumerModule } from '../../../../data/consumer/external-integration/external-integration-consumer.module'
import { PaymentInboxTransferRepositoryModule } from '../../../../data/repository/payment-inbox-transfer/payment-inbox-transfer-repository.module'
import { ProcessPaymentTransactionInteractorModule } from '../../interactor/process-payment-transaction/process-payment-transaction-interactor.module'

@Module({
  imports: [
    ExternalIntegrationConsumerModule,
    PaymentInboxTransferRepositoryModule,
    ProcessPaymentTransactionInteractorModule,
  ],
  providers: [ExternalIntegrationEventListener],
})
export class ExternalIntegrationEventModule {}
