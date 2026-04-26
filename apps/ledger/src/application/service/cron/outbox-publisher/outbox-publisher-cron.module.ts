import { Module } from '@nestjs/common'
import { OutboxPublisherCron } from './outbox-publisher.cron'
import { OutboxPublishInteractorModule } from '../../../interactor/outbox-publish/outbox-publish-interactor.module'
import { OutboxRepositoryModule } from '../../../../data/repository/outbox/outbox-repository.module'

@Module({
  imports: [OutboxPublishInteractorModule, OutboxRepositoryModule],
  providers: [OutboxPublisherCron],
})
export class OutboxPublisherCronModule {}
