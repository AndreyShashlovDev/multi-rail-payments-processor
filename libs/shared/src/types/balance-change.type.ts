export enum BalanceChangeType {
  CREDIT = 'CREDIT', // зачисляем
  DEBIT = 'DEBIT', // списываем
  HOLD = 'HOLD',
  HOLD_IN = 'HOLD_IN', // платеж пришел, но еще не проверен
  RELEASE_HOLD = 'RELEASE_HOLD',
  RELEASE_HOLD_IN = 'RELEASE_HOLD_IN',
  PLATFORM_FEE_ACCRUED = 'PLATFORM_FEE_ACCRUED', // холд фии для консолидации
}
