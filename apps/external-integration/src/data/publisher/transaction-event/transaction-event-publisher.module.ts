import { Module } from '@nestjs/common'
import { TransactionEventPublisher } from './transaction-event.publisher'
import { OutboxRepositoryModule } from '../../repository/outbox/outbox-repository.module'
import { SignatureServiceModule } from '../../../shared/signature/signature-service.module'
import { TransactionKafkaDataSourceModule } from '../../data-source/kafka/transaction-kafka-data-source.module'

@Module({
  imports: [TransactionKafkaDataSourceModule, OutboxRepositoryModule, SignatureServiceModule],
  providers: [TransactionEventPublisher],
  exports: [TransactionEventPublisher],
})
export class TransactionEventPublisherModule {}
