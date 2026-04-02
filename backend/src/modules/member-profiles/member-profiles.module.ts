import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  MemberProfileEntity,
  MemberProfileSchema,
} from './schemas/member-profile.schema';
import { MemberProfilesService } from './member-profiles.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MemberProfileEntity.name, schema: MemberProfileSchema },
    ]),
  ],
  providers: [MemberProfilesService],
  exports: [MemberProfilesService],
})
export class MemberProfilesModule {}
