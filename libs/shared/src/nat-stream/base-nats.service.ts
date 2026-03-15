import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { connect, NatsConnection, JetStreamClient, JetStreamManager, ConsumerMessages } from 'nats'
import { RetentionPolicy, StorageType, AckPolicy } from 'nats/lib/jetstream/jsapi_types'
import { toError } from '@app/utils'

export interface StreamConfig {
  readonly name: string
  readonly subjects: string[]
  readonly retention?: RetentionPolicy
  readonly maxMessages?: number
  readonly maxAge?: number
}

export interface ConsumerConfig {
  readonly stream: string
  readonly durable: string
  readonly filterSubject?: string
  readonly ackPolicy?: AckPolicy
  readonly maxDeliver?: number
  readonly maxAckPending?: number
}

@Injectable()
export abstract class BaseNatsService implements OnModuleInit, OnModuleDestroy {
  protected readonly logger = new Logger(this.constructor.name)
  protected nc?: NatsConnection
  protected js?: JetStreamClient
  protected jsm?: JetStreamManager

  private readonly activeConsumers = new Map<string, ConsumerMessages>()
  private initialized = false

  protected constructor(protected readonly natsUrl: string) {}

  async onModuleInit(): Promise<void> {
    await this.connect()
    await this.setupStreams()
    this.initialized = true
  }

  async onModuleDestroy(): Promise<void> {
    for (const [durable, messages] of this.activeConsumers) {
      messages.stop()
      this.logger.debug(`Consumer "${durable}" stopped`)
    }
    await this.nc?.drain()
    await this.nc?.close()
    this.logger.log('Disconnected from NATS')
  }

  private async connect(): Promise<void> {
    try {
      this.nc = await connect({
        servers: this.natsUrl,
        name: this.constructor.name,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 1000,
      })
      this.js = this.nc.jetstream()
      this.jsm = await this.nc.jetstreamManager()
      this.logger.log(`Connected to NATS at ${this.natsUrl}`)
    } catch (err) {
      const error = toError(err)
      this.logger.error(`Failed to connect to NATS: ${error.message}`)
      throw error
    }
  }

  protected abstract setupStreams(): Promise<void>

  async publish<T>(subject: string, data: T): Promise<void> {
    if (!this.js) throw new Error('Not initialized')

    const payload = new TextEncoder().encode(JSON.stringify(data))
    await this.js.publish(subject, payload)
  }

  protected async startConsuming<T>(config: ConsumerConfig, handler: (data: T) => Promise<void>): Promise<void> {
    if (!this.initialized) {
      throw new Error('BaseNatsService not initialized — call after onModuleInit')
    }

    // запускаем в фоне с retry loop
    this.consumeWithRetry(config, handler).catch((err) => {
      this.logger.error(`Consumer "${config.durable}" fatal error: ${toError(err).message}`)
    })
  }

  private async consumeWithRetry<T>(config: ConsumerConfig, handler: (data: T) => Promise<void>): Promise<void> {
    let retryCount = 0

    while (true) {
      try {
        await this.consumeMessages(config, handler)
        break
      } catch (err) {
        retryCount++
        const delay = Math.min(1000 * retryCount, 30_000)
        this.logger.warn(
          `Consumer "${config.durable}" error, retry ${retryCount} in ${delay}ms: ${toError(err).message}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  private async consumeMessages<T>(config: ConsumerConfig, handler: (data: T) => Promise<void>): Promise<void> {
    if (!this.js) throw new Error('JetStream not initialized')

    const consumer = await this.js.consumers.get(config.stream, config.durable)
    const messages = await consumer.consume({ max_messages: 1 })

    this.activeConsumers.set(config.durable, messages)
    this.logger.log(`Consumer "${config.durable}" started`)

    for await (const msg of messages) {
      try {
        const data = JSON.parse(new TextDecoder().decode(msg.data)) as T
        await handler(data)
        msg.ack()
      } catch (err) {
        this.logger.error(`Consumer "${config.durable}" failed to process message: ${err}`)
        msg.nak()
      }
    }

    this.activeConsumers.delete(config.durable)
  }

  protected async ensureStream(config: StreamConfig): Promise<void> {
    try {
      if (!this.jsm) throw new Error('Not initialized')

      await this.jsm.streams.add({
        name: config.name,
        subjects: config.subjects,
        retention: config.retention || RetentionPolicy.Limits,
        max_msgs: config.maxMessages || 1_000_000,
        max_age: config.maxAge || 86400 * 1_000_000_000,
        storage: StorageType.File,
      })

      this.logger.log(`Stream "${config.name}" ensured`)
    } catch (err) {
      const error = toError(err)
      if (error.message.includes('already in use')) {
        await this.jsm!.streams.update(config.name, {
          subjects: config.subjects,
          max_msgs: config.maxMessages || 1_000_000,
          max_age: config.maxAge || 86400 * 1_000_000_000,
        })
        return
      }
      throw error
    }
  }

  protected async ensureConsumer(config: ConsumerConfig): Promise<void> {
    try {
      if (!this.jsm) throw new Error('Not initialized')

      await this.jsm.consumers.add(config.stream, {
        durable_name: config.durable,
        filter_subject: config.filterSubject,
        ack_policy: config.ackPolicy ?? AckPolicy.Explicit,
        max_deliver: config.maxDeliver ?? 3,
        ack_wait: 30 * 1_000_000_000,
        max_ack_pending: config.maxAckPending ?? 1,
      })

      this.logger.log(`Consumer "${config.durable}" ensured`)
    } catch (err) {
      const error = toError(err)
      if (!error.message.includes('already exists')) {
        throw error
      }
    }
  }
}
