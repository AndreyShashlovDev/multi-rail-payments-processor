import { Logger } from '@nestjs/common'

export class PromiseQueue {
  private readonly logger: Logger = new Logger(PromiseQueue.name)
  private readonly queue: (() => Promise<void>)[] = []
  private inProcess: boolean = false
  private readonly maxSize: number

  constructor(options?: { maxSize?: number }) {
    this.maxSize = options?.maxSize ?? Infinity
  }

  async enqueue(task: () => Promise<void>): Promise<boolean> {
    if (this.queue.length >= this.maxSize) {
      return false
    }
    this.queue.push(task)
    void this.process()
    return true
  }

  private async process(): Promise<void> {
    if (this.inProcess) return

    this.inProcess = true

    try {
      while (this.queue.length > 0) {
        const task = this.queue.shift()!
        await task()
      }
    } finally {
      this.inProcess = false
    }
  }
}