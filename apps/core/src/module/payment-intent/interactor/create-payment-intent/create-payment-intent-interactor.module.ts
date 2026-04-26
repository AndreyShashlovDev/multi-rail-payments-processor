import { Module } from '@nestjs/common'
import { PaymentIntentRepositoryModule } from '../../../../data/repository/payment-intent/payment-intent-repository.module'
import { IntegrationAccountRepositoryModule } from '../../../../data/repository/integration-account/integration-account-repository.module'
import { IntegrationAccountLinkRepositoryModule } from '../../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { CreatePaymentIntentInteractor } from './create-payment-intent.interactor'
import { TxContextModule } from '../../../../shared/tx-context/tx-context.module'

@Module({
  imports: [
    TxContextModule,
    PaymentIntentRepositoryModule,
    IntegrationAccountRepositoryModule,
    IntegrationAccountLinkRepositoryModule,
  ],
  providers: [CreatePaymentIntentInteractor],
  exports: [CreatePaymentIntentInteractor],
})
export class CreatePaymentIntentInteractorModule {}
