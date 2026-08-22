import { createHmac, timingSafeEqual } from 'node:crypto'

export class HmacUtils {
  static sign(payload: object, secret: string): string {
    const canonical = JSON.stringify(this.sortDeep(payload))

    return createHmac('sha256', secret).update(canonical).digest('hex')
  }

  static verify(payload: object, sig: string, secret: string): boolean {
    const expected = this.sign(payload, secret)

    const sigBuf = Buffer.from(sig, 'hex')
    const expectedBuf = Buffer.from(expected, 'hex')

    if (sigBuf.length !== expectedBuf.length) return false

    return timingSafeEqual(sigBuf, expectedBuf)
  }

  private static sortDeep(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map((i) => this.sortDeep(i))

    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce(
          (acc, key) => {
            acc[key] = this.sortDeep((obj as Record<string, unknown>)[key])
            return acc
          },
          {} as Record<string, unknown>,
        )
    }
    return obj
  }
}
