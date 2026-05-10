import { GetCurrencyRateConverterOperation } from '../operation/get-currency-rate-converter.operation'
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { GetConversionRateQuery } from '@app/shared/services/rate/v1/cqrs/get-conversion-rate.query'

@QueryHandler(GetConversionRateQuery)
export class ConverterCurrencyQueryHandler
  extends GetCurrencyRateConverterOperation
  implements IQueryHandler<GetConversionRateQuery>
{
  constructor() {
    super()
  }
}
