export class PayoutAccountNotFoundException extends Error {
  constructor() {
    super('Payout account not found!')
  }
}
