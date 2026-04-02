import { Module } from '@nestjs/common';

import { ChatModule } from '../chat/chat.module';
import { SupportCustomerController } from './support-customer.controller';
import { SupportController } from './support.controller';

@Module({
  imports: [ChatModule],
  controllers: [SupportController, SupportCustomerController],
})
export class SupportModule {}
