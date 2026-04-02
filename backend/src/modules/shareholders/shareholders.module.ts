import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Member, MemberSchema } from '../members/schemas/member.schema';
import { ShareholdersController } from './shareholders.controller';
import { ShareholdersService } from './shareholders.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [ShareholdersController],
  providers: [ShareholdersService],
  exports: [ShareholdersService],
})
export class ShareholdersModule {}
