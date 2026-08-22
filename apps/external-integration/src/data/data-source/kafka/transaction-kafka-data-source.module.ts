import { Module, FactoryProvider } from '@nestjs/common'
import { TransactionKafkaDataSource } from './transaction-kafka-data-source.service'
import { AppKafkaConfig, KafkaConfigModule } from '../../../config'

const Provider: FactoryProvider = {
  provide: TransactionKafkaDataSource,
  inject: [AppKafkaConfig],
  useFactory: (kafkaConfig: AppKafkaConfig) => new TransactionKafkaDataSource(kafkaConfig),
}

@Module({
  imports: [KafkaConfigModule],
  providers: [Provider],
  exports: [Provider],
})
export class TransactionKafkaDataSourceModule {}
