import { Controller, OnModuleInit, Logger } from '@nestjs/common'
import { DemoFullFlowInteractor } from '../../../application/interactor/demo-full-flow/demo-full-flow.interactor'

/**
 * @deprecated just for demo!
 */
@Controller()
export class DemoController implements OnModuleInit {
  private readonly logger: Logger = new Logger(DemoController.name)

  constructor(private readonly demoFullFlowInteractor: DemoFullFlowInteractor) {}

  onModuleInit() {
    this.logger.debug('Wait 2 seconds before run simulation demo!')
    new Promise<void>((resolve) => setTimeout(() => resolve(), 2000))
      .then(() => {
        this.logger.debug('Start simulation demo!')
        return this.demoFullFlowInteractor.execute()
      })
      .catch((e) => this.logger.error(e))
  }
}
