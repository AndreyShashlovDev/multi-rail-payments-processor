import { HmacUtils } from '@app/utils/hmac.utils'
import { SignedEnvelopeEvent, SignedEnvelopeMeta, JsonObject } from '@app/types'
import { validateSync } from 'class-validator'
import { Logger } from '@nestjs/common'

type ServiceName = string

export class SignatureService {
  static readonly REPLAY_WINDOW_SEC = 3000
  private readonly logger: Logger

  constructor(
    private readonly service: ServiceName,
    private readonly secrets: ReadonlyMap<ServiceName, string>,
  ) {
    this.logger = new Logger(`${SignatureService.name}(${service})`)

    if (!this.secrets.has(this.service)) throw new Error(`Secret not presented for current service ${service}`)
  }

  createSignedEnvelop<T>(request: JsonObject<T>): SignedEnvelopeEvent<JsonObject<T>> {
    const meta = new SignedEnvelopeMeta(this.service, Math.floor(Date.now() / 1000), request)
    const sig = this.sign(meta)
    const envelope = new SignedEnvelopeEvent(meta, sig)

    const errors = validateSync(envelope)

    if (errors.length) throw new Error(`Invalid SignedEnvelopeEvent structure ${JSON.stringify(errors)}`)

    return envelope
  }

  verifyEnvelop(envelope: SignedEnvelopeEvent<object>): void {
    const age = Math.floor(Date.now() / 1000) - envelope.meta.timestamp
    if (age > SignatureService.REPLAY_WINDOW_SEC || age < 0) throw new Error('Event out of time window')

    const secret = this.secrets.get(envelope.meta.service)
    if (!secret) throw new Error(`Secret not presented for service ${envelope.meta.service}`)

    const isValid = this.verify(envelope.meta, envelope.sig, secret)
    if (!isValid) throw new Error('Invalid signature')
  }

  private sign(payload: object): string {
    return HmacUtils.sign(payload, this.secrets.get(this.service)!)
  }

  private verify(payload: object, sig: string, secret: string): boolean {
    return HmacUtils.verify(payload, sig, secret)
  }
}
