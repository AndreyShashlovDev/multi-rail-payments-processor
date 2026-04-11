import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { LedgerRepositoryModule } from '../../../data/repository/ledger/ledger-repository.module'
import { ChangePaymentStatusInteractorModule } from '../../../module/payment-intent/interactor/change-payment-status/change-payment-status-interactor.module'
import { CreatePaymentIntentInteractorModule } from '../../../module/payment-intent/interactor/create-payment-intent/create-payment-intent-interactor.module'
import { ExternalIntegrationRepositoryModule } from '../../../data/repository/external-integration/external-integration-repository.module'
import { PaymentInboxTransferRepositoryModule } from '../../../data/repository/payment-inbox-transfer/payment-inbox-transfer-repository.module'
import { ProcessPaymentTransactionInteractorModule } from '../../../module/payment-intent/interactor/process-payment-transaction/process-payment-transaction-interactor.module'

@Module({
  imports: [
    LedgerRepositoryModule,
    PaymentInboxTransferRepositoryModule,
    ExternalIntegrationRepositoryModule,
    ChangePaymentStatusInteractorModule,
    CreatePaymentIntentInteractorModule,
    ProcessPaymentTransactionInteractorModule,
  ],
  controllers: [PaymentController],
})
export class PaymentControllerModule {}
