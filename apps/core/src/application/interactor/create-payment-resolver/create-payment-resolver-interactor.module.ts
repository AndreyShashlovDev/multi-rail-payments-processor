import { Module } from '@nestjs/common'
import { CreatePaymentResolverInteractor } from './create-payment-resolver.interactor'
import { CreatePaymentIntentInteractorModule } from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent-interactor.module'
import { IntegrationAccountLinkRepositoryModule } from '../../../data/repository/integration-account-link/integration-account-link-repository.module'
import { CurrencyRepositoryModule } from '../../../data/repository/currency/currency-repository.module'

@Module({
  imports: [CreatePaymentIntentInteractorModule, IntegrationAccountLinkRepositoryModule, CurrencyRepositoryModule],
  providers: [CreatePaymentResolverInteractor],
  exports: [CreatePaymentResolverInteractor],
})
export class CreatePaymentResolverInteractorModule {}
