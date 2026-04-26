import { Module, Logger } from '@nestjs/common'
import { FinalizePayoutFlowCron } from './finalize-payout-flow.cron'
import { FinalizePayoutFlowInteractorModule } from '../../../interactor/finalize-payout-flow/finalize-payout-flow-interactor.module'

@Module({
  imports: [FinalizePayoutFlowInteractorModule],
  providers: [Logger, FinalizePayoutFlowCron],
})
export class FinalizePayoutFlowCronModule {}
