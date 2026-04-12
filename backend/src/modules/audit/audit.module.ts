import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { Staff, StaffSchema } from '../staff/schemas/staff.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
