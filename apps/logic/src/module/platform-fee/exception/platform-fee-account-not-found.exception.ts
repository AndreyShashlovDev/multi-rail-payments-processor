export class PlatformFeeAccountNotFoundException extends Error {
  constructor() {
    super('Platform fee account not found!')
  }
}
