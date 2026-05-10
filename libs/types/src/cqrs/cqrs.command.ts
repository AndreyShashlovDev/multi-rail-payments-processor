import { Command } from '@nestjs/cqrs'

export class CqrsCommand<T> extends Command<T> {}
