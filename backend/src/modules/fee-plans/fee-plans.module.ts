import { Module } from '@nestjs/common';

import { FeePlansController } from './fee-plans.controller';
import { FeePlansService } from './fee-plans.service';

@Module({
  controllers: [FeePlansController],
  providers: [FeePlansService],
  exports: [FeePlansService],
})
export class FeePlansModule {}
