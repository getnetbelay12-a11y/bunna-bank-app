import 'reflect-metadata';

import mongoose, { Model, Types } from 'mongoose';

import { UserRole } from '../common/enums';
import { Branch, BranchSchema } from '../modules/members/schemas/branch.schema';
import { District, DistrictSchema } from '../modules/members/schemas/district.schema';
import { Staff, StaffSchema } from '../modules/staff/schemas/staff.schema';
import { deriveStaffPermissions } from '../modules/staff/staff-permissions';
import {
  StaffPerformanceDaily,
  StaffPerformanceDailySchema,
} from '../modules/staff-activity/schemas/staff-performance-daily.schema';
import {
  StaffPerformanceMonthly,
  StaffPerformanceMonthlySchema,
} from '../modules/staff-activity/schemas/staff-performance-monthly.schema';
import {
  StaffPerformanceWeekly,
  StaffPerformanceWeeklySchema,
} from '../modules/staff-activity/schemas/staff-performance-weekly.schema';
import {
  StaffPerformanceYearly,
  StaffPerformanceYearlySchema,
} from '../modules/staff-activity/schemas/staff-performance-yearly.schema';

type StaffSeed = {
  staffNumber: string;
  fullName: string;
  identifier: string;
  phone: string;
  email: string;
  role: UserRole;
  metrics: {
    daily: PerformanceSeedMetrics;
    weekly: PerformanceSeedMetrics;
    monthly: PerformanceSeedMetrics;
    yearly: PerformanceSeedMetrics;
  };
};

type PerformanceSeedMetrics = {
  customersHelped: number;
  membersServed: number;
  transactionsCount: number;
  loansHandled: number;
  loanApplicationsCount: number;
  loanApprovedCount: number;
  loanRejectedCount: number;
  loansEscalated: number;
  kycCompleted: number;
  supportResolved: number;
  tasksCompleted: number;
  avgHandlingTime: number;
  responseTimeMinutes: number;
  pendingTasks: number;
  schoolPaymentsCount: number;
  totalTransactionAmount: number;
  score: number;
  status: 'excellent' | 'good' | 'watch' | 'needs_support';
};

async function main() {
  const mongoUri =
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/bunna_bank_app';
  await mongoose.connect(mongoUri);

  const BranchModel = createModel(Branch.name, BranchSchema);
  const DistrictModel = createModel(District.name, DistrictSchema);
  const StaffModel = createModel(Staff.name, StaffSchema);
  const DailyModel = createModel(StaffPerformanceDaily.name, StaffPerformanceDailySchema);
  const WeeklyModel = createModel(StaffPerformanceWeekly.name, StaffPerformanceWeeklySchema);
  const MonthlyModel = createModel(StaffPerformanceMonthly.name, StaffPerformanceMonthlySchema);
  const YearlyModel = createModel(StaffPerformanceYearly.name, StaffPerformanceYearlySchema);

  const branch = await BranchModel.findOne({ name: 'Bahir Dar Branch' }).lean();
  if (!branch) {
    throw new Error('Bahir Dar Branch not found.');
  }

  const district =
    (branch.districtId
      ? await DistrictModel.findById(branch.districtId).lean()
      : await DistrictModel.findOne({ name: 'Bahir Dar District' }).lean()) ?? null;

  if (!district) {
    throw new Error('Bahir Dar District not found.');
  }

  const dayStart = startOfUtcDay(new Date());
  const weekStart = startOfUtcWeek(dayStart);
  const monthStart = startOfUtcMonth(dayStart);
  const yearStart = startOfUtcYear(dayStart);

  const staffSeeds: StaffSeed[] = [
    {
      staffNumber: 'STF-2002',
      fullName: 'Getachew Molla',
      identifier: 'getachew.loan',
      phone: '0911001004',
      email: 'getachew@bunna-bank.local',
      role: UserRole.LOAN_OFFICER,
      metrics: {
        daily: buildMetrics(31, 34, 42, 12, 6, 1, 2, 9, 4, 28, 17, 11, 5, 5, 186000, 92, 'excellent'),
        weekly: buildMetrics(176, 188, 242, 48, 24, 4, 8, 41, 20, 131, 18, 12, 6, 18, 1024000, 91, 'excellent'),
        monthly: buildMetrics(703, 724, 956, 173, 88, 13, 24, 162, 79, 511, 18, 13, 7, 64, 4184000, 90, 'excellent'),
        yearly: buildMetrics(2088, 2146, 2824, 511, 262, 41, 77, 471, 236, 1544, 18, 13, 7, 181, 12230000, 89, 'excellent'),
      },
    },
    {
      staffNumber: 'STF-2006',
      fullName: 'Rahel Desta',
      identifier: 'agent.support@bunnabank.com',
      phone: '0911001006',
      email: 'agent.support@bunnabank.com',
      role: UserRole.SUPPORT_AGENT,
      metrics: {
        daily: buildMetrics(24, 21, 18, 3, 1, 0, 1, 5, 13, 19, 21, 8, 4, 2, 64000, 84, 'good'),
        weekly: buildMetrics(136, 124, 97, 14, 5, 1, 3, 22, 67, 104, 19, 9, 5, 6, 324000, 86, 'good'),
        monthly: buildMetrics(548, 506, 385, 43, 15, 4, 8, 93, 254, 407, 20, 9, 6, 22, 1422000, 85, 'good'),
        yearly: buildMetrics(1568, 1487, 1114, 131, 46, 11, 28, 281, 771, 1187, 19, 10, 6, 73, 4312000, 84, 'good'),
      },
    },
    {
      staffNumber: 'STF-2008',
      fullName: 'Saron Tefera',
      identifier: 'saron.operations',
      phone: '0911001008',
      email: 'saron@bunna-bank.local',
      role: UserRole.LOAN_OFFICER,
      metrics: {
        daily: buildMetrics(16, 13, 14, 4, 1, 1, 2, 3, 2, 11, 33, 22, 9, 1, 28000, 57, 'needs_support'),
        weekly: buildMetrics(85, 79, 82, 19, 6, 5, 7, 14, 11, 58, 28, 19, 10, 4, 208000, 61, 'watch'),
        monthly: buildMetrics(321, 303, 314, 68, 20, 17, 22, 57, 41, 219, 29, 18, 11, 17, 866000, 60, 'watch'),
        yearly: buildMetrics(988, 931, 972, 209, 61, 44, 66, 182, 137, 699, 27, 18, 12, 47, 2527000, 59, 'watch'),
      },
    },
    {
      staffNumber: 'STF-2009',
      fullName: 'Selam Fekadu',
      identifier: 'selam.kyc',
      phone: '0911001009',
      email: 'selam@bunna-bank.local',
      role: UserRole.LOAN_OFFICER,
      metrics: {
        daily: buildMetrics(20, 18, 9, 2, 0, 0, 1, 12, 3, 17, 16, 7, 3, 1, 19000, 88, 'excellent'),
        weekly: buildMetrics(118, 109, 41, 11, 2, 1, 3, 58, 16, 87, 15, 8, 4, 4, 126000, 87, 'good'),
        monthly: buildMetrics(468, 432, 188, 35, 7, 3, 9, 241, 63, 331, 15, 8, 5, 13, 694000, 88, 'excellent'),
        yearly: buildMetrics(1368, 1277, 592, 94, 21, 7, 24, 716, 193, 1018, 15, 9, 6, 41, 2291000, 87, 'good'),
      },
    },
    {
      staffNumber: 'STF-2012',
      fullName: 'Martha Teshome',
      identifier: 'martha.frontline',
      phone: '0911001012',
      email: 'martha@bunna-bank.local',
      role: UserRole.LOAN_OFFICER,
      metrics: {
        daily: buildMetrics(27, 24, 33, 8, 3, 0, 1, 7, 6, 22, 19, 10, 4, 3, 92000, 82, 'good'),
        weekly: buildMetrics(141, 132, 171, 29, 11, 2, 4, 34, 28, 96, 17, 9, 5, 9, 508000, 83, 'good'),
        monthly: buildMetrics(562, 531, 684, 112, 39, 8, 13, 128, 117, 378, 18, 10, 6, 31, 2014000, 84, 'good'),
        yearly: buildMetrics(1640, 1531, 2011, 301, 108, 23, 42, 389, 352, 1128, 18, 10, 7, 98, 6210000, 85, 'good'),
      },
    },
  ];

  for (const seed of staffSeeds) {
    const existingStaff = await StaffModel.findOne({ identifier: seed.identifier }).lean();
    const staffId = existingStaff?._id ? new Types.ObjectId(existingStaff._id) : new Types.ObjectId();

    await StaffModel.updateOne(
      { _id: staffId },
      {
        $set: {
          staffNumber: seed.staffNumber,
          fullName: seed.fullName,
          identifier: seed.identifier,
          phone: seed.phone,
          email: seed.email,
          role: seed.role,
          branchId: branch._id,
          districtId: district._id,
          permissions: deriveStaffPermissions(seed.role),
          passwordHash: 'demo-pass',
          isActive: true,
        },
      },
      { upsert: true },
    );

    await upsertPerformance(DailyModel, staffId, branch._id, district._id, dayStart, seed.metrics.daily);
    await upsertPerformance(WeeklyModel, staffId, branch._id, district._id, weekStart, seed.metrics.weekly);
    await upsertPerformance(MonthlyModel, staffId, branch._id, district._id, monthStart, seed.metrics.monthly);
    await upsertPerformance(YearlyModel, staffId, branch._id, district._id, yearStart, seed.metrics.yearly);
  }

  console.log(
    JSON.stringify(
      {
        seeded: true,
        branch: branch.name,
        district: district.name,
        employees: staffSeeds.map((item) => item.fullName),
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

function buildMetrics(
  customersHelped: number,
  membersServed: number,
  transactionsCount: number,
  loansHandled: number,
  loanApprovedCount: number,
  loanRejectedCount: number,
  loansEscalated: number,
  kycCompleted: number,
  supportResolved: number,
  tasksCompleted: number,
  avgHandlingTime: number,
  responseTimeMinutes: number,
  pendingTasks: number,
  schoolPaymentsCount: number,
  totalTransactionAmount: number,
  score: number,
  status: PerformanceSeedMetrics['status'],
): PerformanceSeedMetrics {
  return {
    customersHelped,
    membersServed,
    transactionsCount,
    loansHandled,
    loanApplicationsCount: loansHandled,
    loanApprovedCount,
    loanRejectedCount,
    loansEscalated,
    kycCompleted,
    supportResolved,
    tasksCompleted,
    avgHandlingTime,
    responseTimeMinutes,
    pendingTasks,
    schoolPaymentsCount,
    totalTransactionAmount,
    score,
    status,
  };
}

async function upsertPerformance(
  model: Model<any>,
  staffId: Types.ObjectId,
  branchId: Types.ObjectId,
  districtId: Types.ObjectId,
  periodStart: Date,
  metrics: PerformanceSeedMetrics,
) {
  await model.updateOne(
    { staffId, periodStart },
    {
      $set: {
        staffId,
        branchId,
        districtId,
        periodStart,
        ...metrics,
      },
    },
    { upsert: true },
  );
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date) {
  const base = new Date(date);
  const day = base.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setUTCDate(base.getUTCDate() + diff);
  return base;
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfUtcYear(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

function createModel<T>(name: string, schema: mongoose.Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

void main().catch((error) => {
  console.error(error);
  void mongoose.disconnect().finally(() => {
    process.exit(1);
  });
});
