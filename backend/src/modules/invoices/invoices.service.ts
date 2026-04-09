import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  UserRole,
} from '../../common/enums';
import { GuardianStudentLinksService } from '../guardian-student-links/guardian-student-links.service';
import { MembersService } from '../members/members.service';
import { buildSchoolFeeReminderNotification } from '../notifications/banking-notification-builders';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailNotificationProvider } from '../notifications/providers/email-notification.provider';
import { TelegramNotificationProvider } from '../notifications/providers/telegram-notification.provider';
import { SchoolReportsService } from '../school-reports/school-reports.service';

import { FeePlansService } from '../fee-plans/fee-plans.service';
import { StudentsService } from '../students/students.service';
import { GenerateInvoiceBatchDto } from './dto/generate-invoice-batch.dto';
import { SendInvoiceRemindersDto } from './dto/send-invoice-reminders.dto';

const INVOICE_FIXTURES = [
  {
    invoiceNo: 'INV-2026-0001',
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    studentId: 'ST-1001',
    studentName: 'Bethel Alemu',
    total: 9500,
    paid: 3500,
    balance: 6000,
    status: 'partially_paid',
    dueDate: '2026-09-05',
  },
  {
    invoiceNo: 'INV-2026-0002',
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    studentId: 'ST-1002',
    studentName: 'Mahlet Tadesse',
    total: 9500,
    paid: 9500,
    balance: 0,
    status: 'paid',
    dueDate: '2026-09-05',
  },
  {
    invoiceNo: 'INV-2026-0101',
    schoolId: 'school_tana',
    schoolName: 'Lake Tana Preparatory School',
    studentId: 'ST-2001',
    studentName: 'Yohannes Kassahun',
    total: 7200,
    paid: 0,
    balance: 7200,
    status: 'open',
    dueDate: '2026-09-12',
  },
];

@Injectable()
export class InvoicesService {
  private readonly invoices = INVOICE_FIXTURES.map((item) => ({ ...item }));

  constructor(
    private readonly configService: ConfigService,
    private readonly feePlansService: FeePlansService,
    private readonly studentsService: StudentsService,
    private readonly guardianStudentLinksService: GuardianStudentLinksService,
    private readonly membersService: MembersService,
    private readonly notificationsService: NotificationsService,
    private readonly schoolReportsService: SchoolReportsService,
    private readonly emailNotificationProvider: EmailNotificationProvider,
    private readonly telegramNotificationProvider: TelegramNotificationProvider,
  ) {}

  list(schoolId?: string, studentId?: string, grade?: string) {
    return this.invoices.filter((item) => {
      if (schoolId && item.schoolId !== schoolId) {
        return false;
      }

      if (studentId && item.studentId !== studentId) {
        return false;
      }

      if (grade) {
        const student = this.studentsService
          .list(item.schoolId)
          .find((entry) => entry.studentId === item.studentId);
        if (student?.grade !== grade) {
          return false;
        }
      }

      return true;
    });
  }

  getOverview() {
    return {
      totals: {
        invoices: this.invoices.length,
        open: this.invoices.filter((item) => item.status === 'open').length,
        partiallyPaid: this.invoices.filter(
          (item) => item.status === 'partially_paid',
        ).length,
        overdueAmount: this.invoices.reduce((sum, item) => sum + item.balance, 0),
      },
      items: this.invoices,
    };
  }

  async sendReminder(invoiceNo: string) {
    const invoice = this.invoices.find((item) => item.invoiceNo === invoiceNo);

    if (invoice) {
      await this.queueParentReminderNotification(invoice);
    }

    return {
      invoiceNo,
      status: invoice ? 'queued' : 'missing',
      message: invoice
        ? `Reminder queued for ${invoice.studentName} (${invoice.invoiceNo}).`
        : `Invoice ${invoiceNo} was not found.`,
    };
  }

  async sendReminders(payload: SendInvoiceRemindersDto) {
    const results = await Promise.all(
      payload.invoiceNos.map((invoiceNo) => this.sendReminder(invoiceNo)),
    );
    const queued = results.filter((item) => item.status === 'queued').length;

    return {
      invoiceNos: payload.invoiceNos,
      queued,
      missing: results.length - queued,
      results,
      message: `Queued ${queued} invoice reminder${queued === 1 ? '' : 's'}.`,
    };
  }

  private async queueParentReminderNotification(invoice: {
    invoiceNo: string;
    schoolId: string;
    schoolName: string;
    studentId: string;
    studentName: string;
    balance: number;
    dueDate: string;
  }) {
    const activeLinks = await this.guardianStudentLinksService.list({
      studentId: invoice.studentId,
      status: 'active',
    });

    if (activeLinks.length === 0) {
      return;
    }

    const student = this.studentsService
      .list(invoice.schoolId)
      .find((item) => item.studentId === invoice.studentId);
    const performance = this.schoolReportsService.getStudentPerformance({
      studentId: invoice.studentId,
      fullName: invoice.studentName,
      grade: student?.grade,
    });
    const schoolPaymentDeepLink =
      `/payments/school?studentId=${encodeURIComponent(invoice.studentId)}` +
      `&invoiceNo=${encodeURIComponent(invoice.invoiceNo)}` +
      `&dueDate=${encodeURIComponent(invoice.dueDate)}` +
      `&amount=${encodeURIComponent(String(invoice.balance))}`;

    for (const link of activeLinks) {
      const member = await this.membersService.findMemberByCustomerId(link.memberCustomerId);
      if (!member?.id) {
        continue;
      }

      const notification = buildSchoolFeeReminderNotification({
        schoolName: invoice.schoolName,
        studentName: invoice.studentName,
        grade: student?.grade,
        dueDate: invoice.dueDate,
        outstandingBalance: invoice.balance,
        parentUpdateSummary: `${performance.latestReportPeriod} average ${performance.latestAverage}% · attendance ${performance.attendanceRate}%`,
      });

      await this.notificationsService.createNotification({
        userType: 'member',
        userId: member.id,
        userRole: UserRole.MEMBER,
        type: notification.type,
        status: notification.status,
        channel: NotificationChannel.MOBILE_PUSH,
        title: notification.title,
        message: notification.message,
        entityType: 'invoice',
        actionLabel: 'Open school payment',
        priority: invoice.balance > 0 ? 'high' : 'normal',
        deepLink: schoolPaymentDeepLink,
        dataPayload: {
          invoiceNo: invoice.invoiceNo,
          schoolId: invoice.schoolId,
          studentId: invoice.studentId,
          dueDate: invoice.dueDate,
          amount: invoice.balance,
        },
      });

      await this.sendReminderEmail(notification, member.id, invoice);
      await this.sendReminderTelegram(notification, member.id, member.telegramChatId, invoice);
    }
  }

  private async sendReminderEmail(
    notification: ReturnType<typeof buildSchoolFeeReminderNotification>,
    memberId: string,
    invoice: {
      invoiceNo: string;
      schoolId: string;
      studentId: string;
      dueDate: string;
      balance: number;
    },
  ) {
    const recipient =
      this.configService.get<string>('notifications.email.testRecipient')?.trim() ||
      'write2get@gmail.com';

    const result = await this.emailNotificationProvider.send({
      channel: NotificationChannel.EMAIL,
      recipient,
      memberId,
      category: NotificationCategory.PAYMENT,
      subject: notification.title,
      messageBody: notification.message,
      actionLabel: 'Open school payment',
      deepLink:
        `/payments/school?studentId=${encodeURIComponent(invoice.studentId)}` +
        `&invoiceNo=${encodeURIComponent(invoice.invoiceNo)}` +
        `&dueDate=${encodeURIComponent(invoice.dueDate)}` +
        `&amount=${encodeURIComponent(String(invoice.balance))}`,
      dataPayload: {
        invoiceNo: invoice.invoiceNo,
        schoolId: invoice.schoolId,
        studentId: invoice.studentId,
        dueDate: invoice.dueDate,
        amount: invoice.balance,
      },
    });

    await this.notificationsService.storeNotificationRecord({
      userType: 'member',
      userId: memberId,
      userRole: UserRole.MEMBER,
      type: notification.type,
      status:
        result.status === 'failed' ? NotificationStatus.FAILED : NotificationStatus.SENT,
      channel: NotificationChannel.EMAIL,
      title: notification.title,
      message: notification.message,
      entityType: 'invoice',
      actionLabel: 'Open school payment',
      priority: 'high',
      deepLink:
        `/payments/school?studentId=${encodeURIComponent(invoice.studentId)}` +
        `&invoiceNo=${encodeURIComponent(invoice.invoiceNo)}` +
        `&dueDate=${encodeURIComponent(invoice.dueDate)}` +
        `&amount=${encodeURIComponent(String(invoice.balance))}`,
      dataPayload: {
        invoiceNo: invoice.invoiceNo,
        schoolId: invoice.schoolId,
        studentId: invoice.studentId,
        dueDate: invoice.dueDate,
        amount: invoice.balance,
        recipient,
      },
      deliveredAt: result.status === 'failed' ? undefined : new Date(),
    });
  }

  private async sendReminderTelegram(
    notification: ReturnType<typeof buildSchoolFeeReminderNotification>,
    memberId: string,
    memberTelegramChatId: string | undefined,
    invoice: {
      invoiceNo: string;
      schoolId: string;
      studentId: string;
      dueDate: string;
      balance: number;
    },
  ) {
    const recipient =
      this.configService.get<string>('notifications.telegram.forceTestChatId')?.trim() ||
      memberTelegramChatId?.trim() ||
      '';

    if (!recipient) {
      await this.notificationsService.storeNotificationRecord({
        userType: 'member',
        userId: memberId,
        userRole: UserRole.MEMBER,
        type: notification.type,
        status: NotificationStatus.FAILED,
        channel: NotificationChannel.TELEGRAM,
        title: notification.title,
        message: notification.message,
        entityType: 'invoice',
        actionLabel: 'Open school payment',
        priority: 'high',
        deepLink:
          `/payments/school?studentId=${encodeURIComponent(invoice.studentId)}` +
          `&invoiceNo=${encodeURIComponent(invoice.invoiceNo)}` +
          `&dueDate=${encodeURIComponent(invoice.dueDate)}` +
          `&amount=${encodeURIComponent(String(invoice.balance))}`,
        dataPayload: {
          invoiceNo: invoice.invoiceNo,
          schoolId: invoice.schoolId,
          studentId: invoice.studentId,
          dueDate: invoice.dueDate,
          amount: invoice.balance,
          error: 'Telegram recipient chat ID not configured.',
        },
      });
      return;
    }

    const result = await this.telegramNotificationProvider.send({
      channel: NotificationChannel.TELEGRAM,
      recipient,
      memberId,
      category: NotificationCategory.PAYMENT,
      subject: notification.title,
      messageBody: notification.message,
      actionLabel: 'Open school payment',
      deepLink:
        `/payments/school?studentId=${encodeURIComponent(invoice.studentId)}` +
        `&invoiceNo=${encodeURIComponent(invoice.invoiceNo)}` +
        `&dueDate=${encodeURIComponent(invoice.dueDate)}` +
        `&amount=${encodeURIComponent(String(invoice.balance))}`,
      dataPayload: {
        invoiceNo: invoice.invoiceNo,
        schoolId: invoice.schoolId,
        studentId: invoice.studentId,
        dueDate: invoice.dueDate,
        amount: invoice.balance,
      },
    });

    await this.notificationsService.storeNotificationRecord({
      userType: 'member',
      userId: memberId,
      userRole: UserRole.MEMBER,
      type: notification.type,
      status:
        result.status === 'failed' ? NotificationStatus.FAILED : NotificationStatus.SENT,
      channel: NotificationChannel.TELEGRAM,
      title: notification.title,
      message: notification.message,
      entityType: 'invoice',
      actionLabel: 'Open school payment',
      priority: 'high',
      deepLink:
        `/payments/school?studentId=${encodeURIComponent(invoice.studentId)}` +
        `&invoiceNo=${encodeURIComponent(invoice.invoiceNo)}` +
        `&dueDate=${encodeURIComponent(invoice.dueDate)}` +
        `&amount=${encodeURIComponent(String(invoice.balance))}`,
      dataPayload: {
        invoiceNo: invoice.invoiceNo,
        schoolId: invoice.schoolId,
        studentId: invoice.studentId,
        dueDate: invoice.dueDate,
        amount: invoice.balance,
        recipient,
      },
      deliveredAt: result.status === 'failed' ? undefined : new Date(),
    });
  }

  previewBatch(payload: GenerateInvoiceBatchDto) {
    const students = this.studentsService
      .list(payload.schoolId)
      .filter(
        (item) =>
          item.status !== 'inactive' && (!payload.grade || item.grade === payload.grade),
      );
    const gradeMap = new Map<
      string,
      { totalStudents: number; activePlan: boolean; feePlanName?: string; invoiceTotal?: number }
    >();

    for (const student of students) {
      const plan = this.feePlansService.findApplicablePlan({
        ...payload,
        grade: student.grade,
      });
      const current = gradeMap.get(student.grade) ?? {
        totalStudents: 0,
        activePlan: Boolean(plan),
        feePlanName: plan?.name,
        invoiceTotal: plan?.total,
      };

      current.totalStudents += 1;
      current.activePlan = current.activePlan || Boolean(plan);
      current.feePlanName = current.feePlanName ?? plan?.name;
      current.invoiceTotal = current.invoiceTotal ?? plan?.total;
      gradeMap.set(student.grade, current);
    }

    const grades = Array.from(gradeMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([grade, value]) => ({
        grade,
        totalStudents: value.totalStudents,
        activePlan: value.activePlan,
        feePlanName: value.feePlanName,
        invoiceTotal: value.invoiceTotal ?? 0,
        canGenerate: value.activePlan,
      }));

    return {
      schoolId: payload.schoolId,
      academicYear: payload.academicYear ?? '2026',
      term: payload.term ?? 'Term 1',
      totalStudents: students.length,
      previewCount: grades
        .filter((item) => item.canGenerate)
        .reduce((sum, item) => sum + item.totalStudents, 0),
      missingGrades: grades.filter((item) => !item.activePlan).map((item) => item.grade),
      grades,
    };
  }

  generateBatch(payload: GenerateInvoiceBatchDto) {
    const students = this.studentsService.list(payload.schoolId).filter((item) => item.status !== 'inactive');
    const scopedStudents = students.filter(
      (item) => !payload.grade || item.grade === payload.grade,
    );
    let generatedInvoices = 0;
    const missingGrades = new Set<string>();

    for (const student of scopedStudents) {
      const plan = this.feePlansService.findApplicablePlan({
        ...payload,
        grade: student.grade,
      });

      if (!plan) {
        missingGrades.add(student.grade);
        continue;
      }

      const existing = this.invoices.find(
        (item) =>
          item.schoolId === payload.schoolId &&
          item.studentId === student.studentId &&
          item.dueDate === resolveDueDate(payload.term),
      );

      if (existing) {
        continue;
      }

      generatedInvoices += 1;
      this.invoices.unshift({
        invoiceNo: `INV-${payload.academicYear ?? '2026'}-${String(this.invoices.length + 1).padStart(4, '0')}`,
        schoolId: payload.schoolId,
        schoolName: plan.schoolName,
        studentId: student.studentId,
        studentName: student.fullName,
        total: plan.total,
        paid: 0,
        balance: plan.total,
        status: 'open',
        dueDate: resolveDueDate(payload.term),
      });
    }

    return {
      schoolId: payload.schoolId,
      academicYear: payload.academicYear ?? '2026',
      term: payload.term ?? 'Term 1',
      generatedInvoices,
      message:
        missingGrades.size > 0
          ? `Generated ${generatedInvoices} invoice records. Missing active fee plans for ${Array.from(missingGrades).join(', ')}.`
          : `Generated ${generatedInvoices} invoice records for ${payload.schoolId}${payload.grade ? ` (${payload.grade})` : ''}.`,
    };
  }

  applyPayment(invoiceNo: string, amount: number) {
    const invoice = this.invoices.find((item) => item.invoiceNo === invoiceNo);

    if (!invoice) {
      return null;
    }

    const safeAmount = Math.max(0, amount);
    const appliedAmount = Math.min(invoice.balance, safeAmount);

    invoice.paid += appliedAmount;
    invoice.balance = Math.max(0, invoice.total - invoice.paid);
    invoice.status =
      invoice.balance === 0
        ? 'paid'
        : invoice.paid > 0
          ? 'partially_paid'
          : 'open';

    return {
      ...invoice,
      appliedAmount,
    };
  }
}

function resolveDueDate(term?: string) {
  if (term === 'Term 2') {
    return '2026-12-05';
  }

  return '2026-09-05';
}
