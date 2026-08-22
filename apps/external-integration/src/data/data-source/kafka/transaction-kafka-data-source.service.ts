import type { KafkaConfig } from '@app/shared'
import { BaseKafkaService, TRANSACTION_DLQ_TOPIC, TRANSACTION_TOPIC } from '@app/shared'
import { Injectable } from '@nestjs/common'

@Injectable()
export class TransactionKafkaDataSource extends BaseKafkaService {
  constructor(config: KafkaConfig) {
    super(config)
  }

  protected async setupTopics(): Promise<void> {
    await this.ensureTopic(TRANSACTION_TOPIC)
    await this.ensureTopic(TRANSACTION_DLQ_TOPIC)
  }
}
