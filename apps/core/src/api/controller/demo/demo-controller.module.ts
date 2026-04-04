import { Module, Logger } from '@nestjs/common'
import { DemoController } from './demo.controller'
import {
  DemoFullFlowInteractorModule,
} from '../../../application/interactor/demo-full-flow/demo-full-flow-interactor.module'

@Module({
  imports: [DemoFullFlowInteractorModule],
  providers: [Logger],
  controllers: [DemoController],
})
export class DemoControllerModule {}
