import { BaseNatsService, IntegrationType, SignatureService } from '@app/shared'
import { Injectable } from '@nestjs/common'
import type { NatsConfig } from '../../../../config'
import { balanceChangeConsumer, BALANCE_CHANGE_STREAM } from '@app/shared/nat-stream/balance-change-stream.types'
import { BALANCE_UPDATED_STREAM } from '@app/shared/nat-stream/balance-updated-stream.types'
import { BalanceChangeRequestEvent } from '@app/shared/services/ledger/v1'
import { BALANCE_FAILED_STREAM } from '@app/shared/nat-stream/balance-failed-stream.types'
import { SignedEnvelopeEvent, JsonObject } from '@app/types'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { BALANCE_PROJECTION_UPDATE_STREAM } from '@app/shared/nat-stream/balance-projection-update-stream.types'

export interface CoreJetstreamHandler {
  balanceChangeHandler(event: JsonObject<BalanceChangeRequestEvent>): Promise<void>
}

@Injectable()
export class CoreJetstreamDataSource extends BaseNatsService {
  private handler: CoreJetstreamHandler | null

  constructor(
    config: NatsConfig,
    private readonly signatureService: SignatureService,
  ) {
    super(config.url)
  }

  protected async setupStreams(): Promise<void> {
    await this.ensureStream(BALANCE_CHANGE_STREAM)
    await this.ensureStream(BALANCE_UPDATED_STREAM)
    await this.ensureStream(BALANCE_FAILED_STREAM)
    await this.ensureStream(BALANCE_PROJECTION_UPDATE_STREAM)

    for (const integration of Object.values(IntegrationType)) {
      await this.ensureConsumer(balanceChangeConsumer(integration))
    }
  }

  setupHandler(handler: CoreJetstreamHandler | null): void {
    this.handler = handler
  }

  async onModuleInit(): Promise<void> {
    await super.onModuleInit()

    for (const integration of Object.values(IntegrationType)) {
      await this.startConsuming<JsonObject<SignedEnvelopeEvent<JsonObject<BalanceChangeRequestEvent>>>>(
        balanceChangeConsumer(integration),
        async (data) => {
          if (this.handler) {
            const envelope = plainToInstance(SignedEnvelopeEvent<JsonObject<BalanceChangeRequestEvent>>, data)
            const errors = validateSync(envelope)

            if (errors.length) throw new Error(`Invalid envelope structure! ${JSON.stringify(errors)}`)

            this.signatureService.verifyEnvelop(envelope)

            await this.handler?.balanceChangeHandler(envelope.meta.payload)
          }
        },
      )
    }
  }
}
