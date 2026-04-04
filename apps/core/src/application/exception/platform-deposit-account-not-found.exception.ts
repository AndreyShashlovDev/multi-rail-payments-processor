export class PlatformDepositAccountNotFoundException extends Error {
  constructor() {
    super('Platform deposit funds account not found!')
  }
}
