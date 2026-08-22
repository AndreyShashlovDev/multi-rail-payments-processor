import { KafkaConfig } from '@app/shared'

export class AppKafkaConfig implements KafkaConfig {
  constructor(
    readonly brokers: ReadonlyArray<string>,
    readonly clientId: string,
    readonly groupIdPrefix: string,
  ) {}
}
