import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GuardianStudentLinksModule } from '../guardian-student-links/guardian-student-links.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { InstitutionsModule } from '../institutions/institutions.module';
import { SchoolPaymentsModule } from '../school-payments/school-payments.module';
import { SchoolReportsModule } from '../school-reports/school-reports.module';
import { Student, StudentSchema } from './schemas/student.schema';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Student.name, schema: StudentSchema }]),
    GuardianStudentLinksModule,
    InstitutionsModule,
    forwardRef(() => InvoicesModule),
    forwardRef(() => SchoolPaymentsModule),
    SchoolReportsModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
