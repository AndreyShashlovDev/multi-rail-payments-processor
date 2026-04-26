import { Module } from '@nestjs/common'
import { OutboxPublishInteractor } from './outbox-publish.interactor'
import { TxContextModule } from '../../../shared/tx-context/tx-context.module'
import { OutboxRepositoryModule } from '../../../data/repository/outbox/outbox-repository.module'
import { LedgerPublisherModule } from '../../../data/publisher/ledger/ledger-publisher.module'
import { ExternalIntegrationPublisherModule } from '../../../data/publisher/external-integration/external-integration-publisher.module'

@Module({
  imports: [TxContextModule, OutboxRepositoryModule, LedgerPublisherModule, ExternalIntegrationPublisherModule],
  providers: [OutboxPublishInteractor],
  exports: [OutboxPublishInteractor],
})
export class OutboxPublishInteractorModule {}
