import { forwardRef, Module } from '@nestjs/common';

import { FeePlansModule } from '../fee-plans/fee-plans.module';
import { GuardianStudentLinksModule } from '../guardian-student-links/guardian-student-links.module';
import { MembersModule } from '../members/members.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchoolReportsModule } from '../school-reports/school-reports.module';
import { StudentsModule } from '../students/students.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    FeePlansModule,
    forwardRef(() => StudentsModule),
    GuardianStudentLinksModule,
    MembersModule,
    NotificationsModule,
    SchoolReportsModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
