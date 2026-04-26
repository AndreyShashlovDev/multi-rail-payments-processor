import { Module } from '@nestjs/common'
import { FinalizePayoutFlowInteractor } from './finalize-payout-flow.interactor'
import { TransactionIntentRepositoryModule } from '../../../data/repository/transaction-intent/transaction-intent-repository.module'
import { WebhookAcceptTransactionInteractorModule } from '../../../module/transaction/interactor/webhook-accept-transaction/webhook-accept-transaction-interactor.module'
import { PromoteTransactionInteractorModule } from '../../../module/transaction/interactor/promote-transaction/promote-transaction-interactor.module'
import { SignTransactionInteractorModule } from '../../../module/transaction/interactor/sign-transaction/sign-transaction-interactor.module'
import { ConfirmTransactionInteractorModule } from '../../../module/transaction/interactor/confirm-transaction/confirm-transaction-interactor.module'
import { OutboxTxContextModule } from '../../../shared/tx-context/outbox-tx-context.module'

@Module({
  imports: [
    OutboxTxContextModule,
    TransactionIntentRepositoryModule,
    SignTransactionInteractorModule,
    PromoteTransactionInteractorModule,
    WebhookAcceptTransactionInteractorModule,
    ConfirmTransactionInteractorModule,
  ],
  providers: [FinalizePayoutFlowInteractor],
  exports: [FinalizePayoutFlowInteractor],
})
export class FinalizePayoutFlowInteractorModule {}
