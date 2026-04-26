import { Module } from '@nestjs/common'
import { OutboxPublishInteractorModule } from '../../interactor/outbox-publish/outbox-publish-interactor.module'
import { OutboxPublishListener } from './outbox-publish.listener'

@Module({
  imports: [OutboxPublishInteractorModule],
  providers: [OutboxPublishListener],
})
export class OutboxPublishListenerModule {}
