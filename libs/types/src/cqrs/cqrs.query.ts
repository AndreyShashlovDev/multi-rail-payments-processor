import { Query } from '@nestjs/cqrs'

export class CqrsQuery<T> extends Query<T> {}
