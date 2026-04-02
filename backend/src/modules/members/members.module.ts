import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { MemberProfilesModule } from '../member-profiles/member-profiles.module';
import { Branch, BranchSchema } from './schemas/branch.schema';
import { District, DistrictSchema } from './schemas/district.schema';
import { Member, MemberSchema } from './schemas/member.schema';
import { MembersController } from './members.controller';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';

@Module({
  imports: [
    AuditModule,
    MemberProfilesModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: District.name, schema: DistrictSchema },
    ]),
  ],
  controllers: [MembersController],
  providers: [MembersRepository, MembersService],
  exports: [MembersService],
})
export class MembersModule {}
