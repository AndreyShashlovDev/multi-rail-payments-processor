import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { Kafka, Producer, Consumer, Admin, logLevel, CompressionTypes, ConfigResourceTypes } from 'kafkajs'
import { toError } from '@app/utils'
import { ConsoleKafkaObserver } from './kafka-observer'
import type { KafkaObserver, KafkaObserverEvent } from './kafka-observer'

export interface KafkaConfig {
  readonly brokers: ReadonlyArray<string>
  readonly clientId: string
}

export interface KafkaTopicConfig {
  readonly name: string
  readonly numPartitions?: number
  readonly replicationFactor?: number
  /** how long the broker keeps messages, in ms. Unset = cluster default (Redpanda/Kafka default ~7 days). */
  readonly retentionMs?: number
}

export interface KafkaConsumerConfig {
  readonly topic: string
  readonly groupId: string
  readonly dlqTopic?: string
  readonly fromBeginning?: boolean
  readonly maxRetries?: number
  readonly retryBaseDelayMs?: number
  readonly retryMaxDelayMs?: number
  readonly partitionsConsumedConcurrently?: number
  /**
   * Stall-watchdog threshold, in ms. See the "silently wedged fetch" comment
   * above `startConsuming` for the failure mode this guards against. Default
   * 60_000 is generous headroom above kafkajs's own long-poll round trip
   * (bounded by `maxWaitTimeInMs`, default 5s) and is safe to leave on any
   * topic regardless of traffic — pass `0` to disable for a given consumer.
   */
  readonly stallTimeoutMs?: number
}

/**
 * KafkaJS counterpart of BaseNatsService: same lifecycle/method shape
 * (publish / startConsuming / ensureTopic) so both transports read as a
 * deliberate side-by-side comparison.
 *
 * Delivery semantics: manual commit only after the handler resolves. On
 * failure the affected partition is paused and retried in place with
 * exponential backoff (redelivers the same message — Kafka has no
 * server-side redelivery counter like JetStream, so attempts are tracked
 * in-memory per process). Once `maxRetries` is exceeded the message is
 * moved to a DLQ topic and the offset is committed so the partition keeps
 * moving. Correctness does not rely on this counter — consumers are
 * expected to be idempotent (see the Postgres inbox pattern).
 *
 * Stall watchdog (the "heartbeat alive, fetch dead" kafkajs failure mode):
 * kafkajs runs one long-poll fetch loop per broker node
 * (`while (isRunning) { await fetch(nodeId) }` in its own `fetcher.js`).
 * If the TCP connection to one particular node wedges — dead socket that
 * never errors or times out, a stuck partition leader — that node's
 * `await fetch(nodeId)` just never resolves. `consumer.events.CRASH` never
 * fires (nothing "crashed" from kafkajs's point of view) and the consumer
 * group heartbeat keeps ticking, because it's driven by *other* nodes'
 * fetch loops finishing their round trips, not by this one. Net effect:
 * the group looks perfectly healthy while messages on that node's
 * partitions silently stop being delivered — no error, no event, nothing
 * to catch.
 *
 * The fix here relies on `FETCH_START`/`FETCH`, a pair of instrumentation
 * events kafkajs emits around every `fetch(nodeId)` round trip, whether or
 * not it returned any messages. That "whether or not it returned any
 * messages" part is what makes this safe to run unconditionally on any
 * topic: a healthy but idle topic still completes empty round trips every
 * few seconds (bounded by `maxWaitTimeInMs`, default 5s), so tracking
 * "longest currently in-flight fetch per node" never confuses a quiet
 * topic with a stuck one — unlike a naive "no message received in N ms"
 * timer, which would. When a node's fetch has been in flight longer than
 * `KafkaConsumerConfig.stallTimeoutMs`, we don't try to nurse that specific
 * Consumer back to health — there's no public kafkajs API to cancel a
 * single wedged fetch. Instead we recycle the whole Consumer: disconnect
 * it (best-effort, fire-and-forget — the same wedge can make disconnect()
 * hang too, so we never await it inline) and spin up a fresh one,
 * re-subscribed to the same topic/group. The in-flight retry/backoff
 * bookkeeping (the `attempts` map below) survives the swap since it's
 * keyed by `topic:partition:offset`, not by Consumer instance.
 */
@Injectable()
export abstract class BaseKafkaService implements OnModuleInit, OnModuleDestroy {
  protected readonly logger = new Logger(this.constructor.name)
  protected kafka?: Kafka
  protected producer?: Producer

  private admin?: Admin
  private readonly consumers: Consumer[] = []
  private readonly watchdogTimers: NodeJS.Timeout[] = []
  private initialized = false
  private stopped = false

  // Defaults to a plain console sink so there's something to look at from
  // day one; pass a real KafkaObserver implementation once one exists
  // (Prometheus counters, etc.) — existing subclasses that only call
  // `super(config)` are unaffected.
  protected constructor(
    protected readonly config: KafkaConfig,
    private readonly observer: KafkaObserver = new ConsoleKafkaObserver(),
  ) {}

  async onModuleInit(): Promise<void> {
    // NestJS can call onModuleInit more than once on the very same
    // instance when a provider is exported from its owning module and also
    // injected by class reference into another module's own
    // FactoryProvider (a confirmed lifecycle-hook quirk, not something
    // specific to this code — see TransactionEventPublisherSourceModule
    // for the case that hits it). Guard idempotently rather than fight it.
    if (this.initialized) {
      throw new Error('Already initialized!')
    }

    await this.connect()
    await this.setupTopics()
    this.initialized = true
  }

  async onModuleDestroy(): Promise<void> {
    // flip before disconnecting so any in-flight setTimeout-scheduled
    // `consumer.resume()` (see startConsuming's retry/backoff) sees the
    // service is shutting down and skips resuming a disconnected consumer,
    // and so a watchdog tick mid-flight skips recycling a consumer we're
    // about to tear down anyway
    this.stopped = true

    for (const timer of this.watchdogTimers) {
      clearInterval(timer)
    }

    for (const consumer of this.consumers) {
      await consumer.disconnect()
      this.logger.debug('Consumer disconnected')
    }
    await this.admin?.disconnect()
    await this.producer?.disconnect()
    this.logger.log('Disconnected from Kafka')
  }

  private async connect(): Promise<void> {
    try {
      this.kafka = new Kafka({
        brokers: this.config.brokers as string[],
        clientId: this.config.clientId,
        logLevel: logLevel.NOTHING,
        retry: { retries: 8, initialRetryTime: 300, maxRetryTime: 30_000 },
      })

      this.producer = this.kafka.producer({
        idempotent: true,
        maxInFlightRequests: 5,
        allowAutoTopicCreation: false,
      })
      this.producer.on(this.producer.events.DISCONNECT, () => this.logger.warn('Producer disconnected'))

      await this.producer.connect()

      this.admin = this.kafka.admin()
      await this.admin.connect()

      this.logger.log(`Connected to Kafka at ${this.config.brokers.join(',')}`)
    } catch (err) {
      const error = toError(err)
      this.logger.error(`Failed to connect to Kafka: ${error.message}`)
      throw error
    }
  }

  protected abstract setupTopics(): Promise<void>

  // A KafkaObserver is third-party-supplied code (a Prometheus client, etc.)
  // called from deep inside delivery/retry/commit logic — it must never be
  // able to perturb that logic just by throwing. Route every call through
  // here instead of calling `this.observer.onEvent` directly.
  private emitObserverEvent(event: KafkaObserverEvent): void {
    try {
      this.observer.onEvent(event)
    } catch (err) {
      this.logger.warn(`KafkaObserver threw while handling "${event.type}": ${toError(err).message}`)
    }
  }

  async publish<T>(topic: string, key: string, data: T): Promise<void> {
    if (!this.producer) throw new Error('Not initialized')

    await this.producer.send({
      topic,
      acks: -1,
      compression: CompressionTypes.None,
      messages: [{ key, value: JSON.stringify(data) }],
    })
  }

  protected async startConsuming<T>(config: KafkaConsumerConfig, handler: (data: T) => Promise<void>): Promise<void> {
    if (!this.initialized) {
      throw new Error('BaseKafkaService not initialized — call after onModuleInit')
    }
    if (!this.kafka || !this.producer) throw new Error('Not initialized')

    const maxRetries = config.maxRetries ?? 3
    const baseDelay = config.retryBaseDelayMs ?? 1_000
    const maxDelay = config.retryMaxDelayMs ?? 30_000
    // keyed by topic:partition:offset (not by Consumer instance) so a
    // watchdog-triggered recycle below doesn't reset anyone's retry count
    const attempts = new Map<string, number>()

    const stallTimeoutMs = config.stallTimeoutMs ?? 60_000
    // nodeId -> when its currently in-flight fetch() round trip started;
    // see the stall-watchdog comment on the class for why this is the signal
    const fetchStartedAt = new Map<number, number>()
    let liveConsumer: Consumer | undefined
    let recycling = false

    // (Re)creates the Consumer, wires it up, and starts `consumer.run()`.
    // Pulled out of the main body so the watchdog below can call it again
    // in place of a Consumer it just gave up on — everything else in this
    // method (attempts map, watchdog timer, fetchStartedAt map) is shared
    // across recreations, only the Consumer object itself is replaced.
    const runConsumer = async (): Promise<void> => {
      const consumer = this.kafka!.consumer({
        groupId: config.groupId,
        sessionTimeout: 30_000,
        heartbeatInterval: 3_000,
        allowAutoTopicCreation: false,
      })

      consumer.on(consumer.events.CRASH, (event) => {
        this.logger.error(`Consumer "${config.groupId}" crashed`, event)
        this.emitObserverEvent({
          type: 'crash',
          groupId: config.groupId,
          error: event.payload.error,
          willRestart: event.payload.restart,
        })
      })

      // `attempts` is keyed by topic:partition:offset and only ever pruned
      // by `commit()`/the DLQ path — a partition revoked from us mid-retry
      // (rebalance from a deploy, a scale event, another instance joining)
      // would otherwise leave its in-flight keys in the map forever, since
      // we'll never see that offset again to prune it ourselves. GROUP_JOIN
      // fires after every (re)join with our current assignment, so use it
      // to drop anything for a partition we no longer own.
      consumer.on(consumer.events.GROUP_JOIN, ({ payload }) => {
        const assigned = new Set(payload.memberAssignment[config.topic] ?? [])

        for (const key of attempts.keys()) {
          const [topic, partition] = key.split(':')
          if (topic === config.topic && !assigned.has(Number(partition))) {
            attempts.delete(key)
          }
        }
      })

      if (stallTimeoutMs > 0) {
        consumer.on(consumer.events.FETCH_START, ({ payload }) => fetchStartedAt.set(payload.nodeId, Date.now()))
        consumer.on(consumer.events.FETCH, ({ payload }) => fetchStartedAt.delete(payload.nodeId))
      }

      await consumer.connect()
      await consumer.subscribe({
        topic: config.topic,
        fromBeginning: config.fromBeginning ?? false,
      })

      this.consumers.push(consumer)
      liveConsumer = consumer

      // Pauses the partition and schedules a resume after an exponential
      // backoff. Shared by the normal retry path and the "couldn't even
      // reach the DLQ" fallback below — both just want "back off and try
      // this same message again later" with the same guards.
      const pauseAndRetryLater = (topic: string, partition: number, attempt: number): number => {
        const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay)

        consumer.pause([{ topic, partitions: [partition] }])
        setTimeout(() => {
          // the service may have shut down, or this partition may have
          // been revoked in a rebalance, by the time this timer fires —
          // resuming then would either be a no-op or throw into an
          // unhandled timer callback, so guard both explicitly
          if (this.stopped) return

          try {
            consumer.resume([{ topic, partitions: [partition] }])
          } catch (resumeErr) {
            this.logger.warn(
              `Consumer "${config.groupId}" failed to resume ${topic}:${partition}: ${toError(resumeErr).message}`,
            )
          }
        }, delay)

        return delay
      }

      await consumer.run({
        autoCommit: false,
        partitionsConsumedConcurrently: config.partitionsConsumedConcurrently ?? 3,
        eachMessage: async ({ topic, partition, message }) => {
          const messageKey = `${topic}:${partition}:${message.offset}`
          const nextOffset = (BigInt(message.offset) + 1n).toString()

          // Committing is deliberately kept OUT of the try/catch that decides
          // retry/DLQ. A commit can fail on its own (most commonly: this
          // partition was revoked from us mid-flight by a rebalance, so the
          // broker rejects our now-stale generation) even though the handler
          // already succeeded. That's not a processing failure — whoever now
          // owns the partition will just reprocess from the last committed
          // offset — so it must never be counted as a retry attempt or route
          // an already-handled message to the DLQ.
          const commit = async (): Promise<void> => {
            try {
              await consumer.commitOffsets([{ topic, partition, offset: nextOffset }])
              attempts.delete(messageKey)
            } catch (commitErr) {
              const error = toError(commitErr)
              this.logger.warn(
                `Consumer "${config.groupId}" processed ${messageKey} but failed to commit ` +
                  `(likely lost partition ownership in a rebalance): ${error.message}`,
              )
              this.emitObserverEvent({ type: 'commit_lost', groupId: config.groupId, topic, partition, error })
            }
          }

          try {
            const data = JSON.parse(message.value?.toString() ?? 'null') as T
            await handler(data)
          } catch (err) {
            const attempt = (attempts.get(messageKey) ?? 0) + 1
            attempts.set(messageKey, attempt)
            const error = toError(err)

            if (attempt > maxRetries) {
              this.logger.error(
                `Consumer "${config.groupId}" giving up on ${messageKey} after ${attempt - 1} retries: ${error.message}`,
              )

              if (config.dlqTopic) {
                try {
                  await this.producer!.send({
                    topic: config.dlqTopic,
                    messages: [
                      {
                        key: message.key,
                        value: message.value,
                        headers: {
                          'x-error': error.message,
                          'x-source-topic': topic,
                          'x-source-partition': String(partition),
                          'x-source-offset': message.offset,
                        },
                      },
                    ],
                  })
                  this.emitObserverEvent({
                    type: 'dlq_sent',
                    groupId: config.groupId,
                    topic,
                    partition,
                    dlqTopic: config.dlqTopic,
                  })
                } catch (dlqErr) {
                  // A DLQ-topic outage must never fall through to `commit()`
                  // below — that would ack a message nobody actually
                  // recorded anywhere, i.e. silent data loss. Back off and
                  // retry instead: `attempt` is already past `maxRetries` so
                  // this same branch (send-to-DLQ) runs again next time,
                  // until it either succeeds or someone intervenes.
                  const dlqError = toError(dlqErr)
                  this.logger.error(
                    `Consumer "${config.groupId}" failed to send ${messageKey} to DLQ "${config.dlqTopic}", ` +
                      `will keep retrying instead of committing: ${dlqError.message}`,
                  )
                  this.emitObserverEvent({
                    type: 'dlq_send_failed',
                    groupId: config.groupId,
                    topic,
                    partition,
                    dlqTopic: config.dlqTopic,
                    error: dlqError,
                  })
                  pauseAndRetryLater(topic, partition, attempt)
                  throw err
                }
              }

              await commit()
              return
            }

            const delay = pauseAndRetryLater(topic, partition, attempt)
            this.logger.warn(
              `Consumer "${config.groupId}" failed on ${messageKey}, retry ${attempt}/${maxRetries} in ${delay}ms: ${error.message}`,
            )
            this.emitObserverEvent({
              type: 'retry',
              groupId: config.groupId,
              topic,
              partition,
              attempt,
              maxRetries,
              delayMs: delay,
              error,
            })

            // rethrow so KafkaJS stops iterating this partition's batch without
            // advancing the offset — the paused partition redelivers the same
            // message once resumed
            throw err
          }

          await commit()
        },
      })

      this.logger.log(`Consumer "${config.groupId}" started on topic "${config.topic}"`)
      this.emitObserverEvent({ type: 'consumer_started', groupId: config.groupId, topic: config.topic })
    }

    await runConsumer()

    if (stallTimeoutMs > 0) {
      // Checked well below the threshold so a stall is caught within a
      // fraction of it, not up to a whole extra `stallTimeoutMs` late.
      const checkIntervalMs = Math.min(stallTimeoutMs / 4, 15_000)

      const timer = setInterval(() => {
        if (this.stopped || recycling) return

        const now = Date.now()
        const stalledNodeId = [...fetchStartedAt.entries()].find(
          ([, startedAt]) => now - startedAt > stallTimeoutMs,
        )?.[0]

        if (stalledNodeId === undefined) return

        recycling = true
        this.logger.error(
          `Consumer "${config.groupId}" fetch to broker node ${stalledNodeId} has been in flight for over ` +
            `${stallTimeoutMs}ms with no response — assuming a wedged kafkajs fetch loop (heartbeat can stay ` +
            `alive via other nodes while this happens), recycling the consumer`,
        )
        this.emitObserverEvent({
          type: 'stall_recycle',
          groupId: config.groupId,
          topic: config.topic,
          nodeId: stalledNodeId,
          stallTimeoutMs,
        })

        // this consumer is presumed wedged, not merely slow — don't await
        // disconnect() inline, the same wedge can make it hang too. Firing
        // the replacement off in parallel is the actual recovery; this is
        // just best-effort cleanup of the old socket/group membership.
        const dead = liveConsumer
        if (dead) {
          const idx = this.consumers.indexOf(dead)
          if (idx >= 0) this.consumers.splice(idx, 1)
          dead
            .disconnect()
            .catch((err) =>
              this.logger.warn(
                `Stalled consumer "${config.groupId}" failed to disconnect cleanly: ${toError(err).message}`,
              ),
            )
        }

        // these belonged to the abandoned consumer's fetchers — irrelevant
        // once we've decided to replace it, and would otherwise immediately
        // re-trigger the check above against the new consumer's nodeIds
        fetchStartedAt.clear()

        // `recycling` stays true across every attempt below, not just the
        // first one: if runConsumer() itself fails (broker unreachable
        // right now, say), there is no Consumer left at all — nothing for
        // FETCH_START/FETCH to ever fire on again, so the stall check above
        // would otherwise never re-trigger and this stream would stay dead
        // until the process restarts. Keep retrying on the same cadence
        // instead of giving up after one attempt.
        const recover = (): void => {
          runConsumer()
            .then(() => {
              recycling = false
            })
            .catch((err) => {
              this.logger.error(
                `Consumer "${config.groupId}" failed to restart after stall, retrying in ${checkIntervalMs}ms: ${toError(err).message}`,
              )
              if (this.stopped) {
                recycling = false
                return
              }
              setTimeout(recover, checkIntervalMs)
            })
        }

        recover()
      }, checkIntervalMs)

      this.watchdogTimers.push(timer)
    }
  }

  protected async ensureTopic(config: KafkaTopicConfig): Promise<void> {
    if (!this.admin) throw new Error('Not initialized')

    const desiredPartitions = config.numPartitions ?? 6
    const existing = await this.admin.listTopics()

    if (!existing.includes(config.name)) {
      await this.admin.createTopics({
        topics: [
          {
            topic: config.name,
            numPartitions: desiredPartitions,
            replicationFactor: config.replicationFactor ?? 1,
            configEntries:
              config.retentionMs !== undefined ? [{ name: 'retention.ms', value: String(config.retentionMs) }] : [],
          },
        ],
      })

      this.logger.log(`Topic "${config.name}" created with ${desiredPartitions} partitions`)
      return
    }

    // Kafka partitions can only grow, never shrink, and growing changes
    // key→partition hashing for messages produced after the resize — this
    // is a one-time, mildly disruptive operation, fine for dev/empty
    // topics, but think twice before bumping numPartitions on a live one.
    const [metadata] = (await this.admin.fetchTopicMetadata({ topics: [config.name] })).topics
    const currentPartitions = metadata.partitions.length

    if (currentPartitions < desiredPartitions) {
      await this.admin.createPartitions({
        topicPartitions: [{ topic: config.name, count: desiredPartitions }],
      })
      this.logger.log(`Topic "${config.name}" partitions increased ${currentPartitions} -> ${desiredPartitions}`)
    }

    if (config.retentionMs !== undefined) {
      await this.reconcileRetention(config.name, config.retentionMs)
    }

    this.logger.log(`Topic "${config.name}" ensured (${Math.max(currentPartitions, desiredPartitions)} partitions)`)
  }

  private async reconcileRetention(topic: string, retentionMs: number): Promise<void> {
    if (!this.admin) throw new Error('Not initialized')

    const [resource] = (
      await this.admin.describeConfigs({
        resources: [
          {
            type: ConfigResourceTypes.TOPIC,
            name: topic,
            configNames: ['retention.ms'],
          },
        ],
        includeSynonyms: false,
      })
    ).resources

    const current = resource.configEntries.find((entry) => entry.configName === 'retention.ms')?.configValue

    if (current === String(retentionMs)) return

    await this.admin.alterConfigs({
      validateOnly: false,
      resources: [
        {
          type: ConfigResourceTypes.TOPIC,
          name: topic,
          configEntries: [{ name: 'retention.ms', value: String(retentionMs) }],
        },
      ],
    })

    this.logger.log(`Topic "${topic}" retention.ms changed ${current ?? '(default)'} -> ${retentionMs}`)
  }
}
