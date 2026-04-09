import { forwardRef, Module } from '@nestjs/common';

import { InvoicesModule } from '../invoices/invoices.module';
import { SchoolPaymentsController } from './school-payments.controller';
import { SchoolPaymentsService } from './school-payments.service';

@Module({
  imports: [forwardRef(() => InvoicesModule)],
  controllers: [SchoolPaymentsController],
  providers: [SchoolPaymentsService],
  exports: [SchoolPaymentsService],
})
export class SchoolPaymentsModule {}
