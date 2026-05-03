export class DuplicateRequestException extends Error {
  constructor(idempotencyKey: string) {
    super(`Request already processed! key ${idempotencyKey}`)
    this.name = DuplicateRequestException.name
  }
}
