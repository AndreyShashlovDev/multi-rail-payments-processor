import { Module } from '@nestjs/common'
import { CorePaymentRepository } from './core-payment.repository'
import { CoreGrpcClientModule } from '../../data-source/grpc/core/core-grpc-client.module'

@Module({
  imports: [CoreGrpcClientModule],
  providers: [CorePaymentRepository],
  exports: [CorePaymentRepository],
})
export class CorePaymentRepositoryModule {}
