import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { InvoicesService } from '../invoices/invoices.service';
import { SchoolPaymentsService } from '../school-payments/school-payments.service';
import { SchoolReportsService } from '../school-reports/school-reports.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ImportStudentsDto } from './dto/import-students.dto';
import { StudentRegistryQueryDto } from './dto/student-registry-query.dto';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly invoicesService: InvoicesService,
    private readonly schoolPaymentsService: SchoolPaymentsService,
    private readonly schoolReportsService: SchoolReportsService,
  ) {}

  @Get()
  async list(@Query() query: StudentRegistryQueryDto) {
    const students = this.studentsService.listRegistry(query);
    return students.map((item) => this.enrichStudent(item));
  }

  @Get('overview')
  async getOverview() {
    const overview = this.studentsService.getOverview();
    return {
      ...overview,
      students: overview.students.map((item) => this.enrichStudent(item)),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('linked/me')
  async getLinkedStudents(@CurrentUser() currentUser: AuthenticatedUser) {
    const students = await this.studentsService.listLinkedToGuardian(currentUser);
    return students.map((item) => this.enrichStudent(item));
  }

  @Post()
  async create(@Body() payload: CreateStudentDto) {
    return this.enrichStudent(await this.studentsService.create(payload));
  }

  @Post('import')
  async importStudents(@Body() payload: ImportStudentsDto) {
    const result = await this.studentsService.importStudents(payload);
    return {
      ...result,
      items: result.items.map((item) => this.enrichStudent(item)),
    };
  }

  private enrichStudent(item: {
    schoolId: string;
    schoolName: string;
    studentId: string;
    fullName: string;
    grade: string;
    section: string;
    guardianName: string;
    guardianPhone: string;
    parentAccountNumber?: string;
    status: string;
  }) {
    const invoices = this.invoicesService.list(item.schoolId, item.studentId);
    const collections = this.schoolPaymentsService.list({
      schoolId: item.schoolId,
      studentId: item.studentId,
    });
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.paid, 0);
    const outstandingBalance = invoices.reduce(
      (sum, invoice) => sum + invoice.balance,
      0,
    );
    const latestInvoice = [...invoices].sort((left, right) =>
      right.dueDate.localeCompare(left.dueDate),
    )[0];
    const latestCollection = [...collections].sort((left, right) =>
      right.recordedAt.localeCompare(left.recordedAt),
    )[0];
    const paymentStatus =
      totalInvoiced === 0
        ? 'pending_billing'
        : outstandingBalance === 0
          ? 'paid'
          : totalPaid > 0
            ? 'partially_paid'
            : 'unpaid';
    const performance = this.schoolReportsService.getStudentPerformance({
      studentId: item.studentId,
      fullName: item.fullName,
      grade: item.grade,
    });

    return {
      ...item,
      paymentSummary: {
        totalInvoiced,
        totalPaid,
        outstandingBalance,
        paymentStatus,
        latestInvoiceNo: latestInvoice?.invoiceNo,
        latestInvoiceStatus: latestInvoice?.status ?? 'not_generated',
        latestReceiptNo: latestCollection?.receiptNo,
        latestPaymentAt: latestCollection?.recordedAt,
        nextDueDate: latestInvoice?.dueDate,
        monthlyFee: latestInvoice?.total ?? latestCollection?.amount ?? 0,
      },
      performanceSummary: performance,
      parentUpdateSummary: `${item.grade} · ${performance.latestReportPeriod} average ${performance.latestAverage}% · attendance ${performance.attendanceRate}%`,
    };
  }
}
