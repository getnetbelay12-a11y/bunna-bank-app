"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const mongoose_1 = __importStar(require("mongoose"));
const dotenv_1 = require("dotenv");
const enums_1 = require("../common/enums");
const district_schema_1 = require("../modules/members/schemas/district.schema");
const branch_schema_1 = require("../modules/members/schemas/branch.schema");
const member_schema_1 = require("../modules/members/schemas/member.schema");
const staff_schema_1 = require("../modules/staff/schemas/staff.schema");
const savings_account_schema_1 = require("../modules/savings/schemas/savings-account.schema");
const transaction_schema_1 = require("../modules/payments/schemas/transaction.schema");
const school_payment_schema_1 = require("../modules/payments/schemas/school-payment.schema");
const loan_schema_1 = require("../modules/loans/schemas/loan.schema");
const notification_schema_1 = require("../modules/notifications/schemas/notification.schema");
const vote_schema_1 = require("../modules/voting/schemas/vote.schema");
const vote_option_schema_1 = require("../modules/voting/schemas/vote-option.schema");
const chat_conversation_schema_1 = require("../modules/chat/schemas/chat-conversation.schema");
const chat_message_schema_1 = require("../modules/chat/schemas/chat-message.schema");
const chat_assignment_schema_1 = require("../modules/chat/schemas/chat-assignment.schema");
const branch_performance_daily_schema_1 = require("../modules/staff-activity/schemas/branch-performance-daily.schema");
const district_performance_daily_schema_1 = require("../modules/staff-activity/schemas/district-performance-daily.schema");
const staff_performance_daily_schema_1 = require("../modules/staff-activity/schemas/staff-performance-daily.schema");
const staff_performance_weekly_schema_1 = require("../modules/staff-activity/schemas/staff-performance-weekly.schema");
const staff_performance_monthly_schema_1 = require("../modules/staff-activity/schemas/staff-performance-monthly.schema");
const staff_performance_yearly_schema_1 = require("../modules/staff-activity/schemas/staff-performance-yearly.schema");
async function run() {
    loadSeedEnvironment();
    const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/cbe_bank_app';
    await mongoose_1.default.connect(mongoUri);
    const DistrictModel = createModel(district_schema_1.District.name, district_schema_1.DistrictSchema);
    const BranchModel = createModel(branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
    const MemberModel = createModel(member_schema_1.Member.name, member_schema_1.MemberSchema);
    const StaffModel = createModel(staff_schema_1.Staff.name, staff_schema_1.StaffSchema);
    const SavingsAccountModel = createModel(savings_account_schema_1.SavingsAccount.name, savings_account_schema_1.SavingsAccountSchema);
    const TransactionModel = createModel(transaction_schema_1.Transaction.name, transaction_schema_1.TransactionSchema);
    const SchoolPaymentModel = createModel(school_payment_schema_1.SchoolPayment.name, school_payment_schema_1.SchoolPaymentSchema);
    const LoanModel = createModel(loan_schema_1.Loan.name, loan_schema_1.LoanSchema);
    const NotificationModel = createModel(notification_schema_1.Notification.name, notification_schema_1.NotificationSchema);
    const VoteModel = createModel(vote_schema_1.Vote.name, vote_schema_1.VoteSchema);
    const VoteOptionModel = createModel(vote_option_schema_1.VoteOption.name, vote_option_schema_1.VoteOptionSchema);
    const ChatConversationModel = createModel(chat_conversation_schema_1.ChatConversation.name, chat_conversation_schema_1.ChatConversationSchema);
    const ChatMessageModel = createModel(chat_message_schema_1.ChatMessage.name, chat_message_schema_1.ChatMessageSchema);
    const ChatAssignmentModel = createModel(chat_assignment_schema_1.ChatAssignment.name, chat_assignment_schema_1.ChatAssignmentSchema);
    const StaffPerformanceDailyModel = createModel(staff_performance_daily_schema_1.StaffPerformanceDaily.name, staff_performance_daily_schema_1.StaffPerformanceDailySchema);
    const StaffPerformanceWeeklyModel = createModel(staff_performance_weekly_schema_1.StaffPerformanceWeekly.name, staff_performance_weekly_schema_1.StaffPerformanceWeeklySchema);
    const StaffPerformanceMonthlyModel = createModel(staff_performance_monthly_schema_1.StaffPerformanceMonthly.name, staff_performance_monthly_schema_1.StaffPerformanceMonthlySchema);
    const StaffPerformanceYearlyModel = createModel(staff_performance_yearly_schema_1.StaffPerformanceYearly.name, staff_performance_yearly_schema_1.StaffPerformanceYearlySchema);
    const BranchPerformanceDailyModel = createModel(branch_performance_daily_schema_1.BranchPerformanceDaily.name, branch_performance_daily_schema_1.BranchPerformanceDailySchema);
    const DistrictPerformanceDailyModel = createModel(district_performance_daily_schema_1.DistrictPerformanceDaily.name, district_performance_daily_schema_1.DistrictPerformanceDailySchema);
    await Promise.all([
        DistrictPerformanceDailyModel.deleteMany({}),
        BranchPerformanceDailyModel.deleteMany({}),
        StaffPerformanceYearlyModel.deleteMany({}),
        StaffPerformanceMonthlyModel.deleteMany({}),
        StaffPerformanceWeeklyModel.deleteMany({}),
        StaffPerformanceDailyModel.deleteMany({}),
        ChatAssignmentModel.deleteMany({}),
        ChatMessageModel.deleteMany({}),
        ChatConversationModel.deleteMany({}),
        VoteOptionModel.deleteMany({}),
        VoteModel.deleteMany({}),
        NotificationModel.deleteMany({}),
        SchoolPaymentModel.deleteMany({}),
        TransactionModel.deleteMany({}),
        SavingsAccountModel.deleteMany({}),
        LoanModel.deleteMany({}),
        StaffModel.deleteMany({}),
        MemberModel.deleteMany({}),
        BranchModel.deleteMany({}),
        DistrictModel.deleteMany({}),
    ]);
    const bahirDarDistrictId = new mongoose_1.Types.ObjectId();
    const gondarDistrictId = new mongoose_1.Types.ObjectId();
    await DistrictModel.insertMany([
        {
            _id: bahirDarDistrictId,
            code: 'DIST-BDR',
            name: 'Bahir Dar District',
            isActive: true,
        },
        {
            _id: gondarDistrictId,
            code: 'DIST-GDR',
            name: 'Gondar District',
            isActive: true,
        },
    ]);
    const bahirDarBranchId = new mongoose_1.Types.ObjectId();
    const gondarBranchId = new mongoose_1.Types.ObjectId();
    const debreMarkosBranchId = new mongoose_1.Types.ObjectId();
    await BranchModel.insertMany([
        {
            _id: bahirDarBranchId,
            code: 'BR-BDR-01',
            name: 'Bahir Dar Branch',
            districtId: bahirDarDistrictId,
            city: 'Bahir Dar',
            isActive: true,
        },
        {
            _id: gondarBranchId,
            code: 'BR-GDR-01',
            name: 'Gondar Branch',
            districtId: gondarDistrictId,
            city: 'Gondar',
            isActive: true,
        },
        {
            _id: debreMarkosBranchId,
            code: 'BR-DMK-01',
            name: 'Debre Markos Branch',
            districtId: bahirDarDistrictId,
            city: 'Debre Markos',
            isActive: true,
        },
    ]);
    const adminStaffId = new mongoose_1.Types.ObjectId();
    const headOfficeManagerId = new mongoose_1.Types.ObjectId();
    const branchLoanOfficerId = new mongoose_1.Types.ObjectId();
    const districtLoanOfficerId = new mongoose_1.Types.ObjectId();
    const districtStaffId = new mongoose_1.Types.ObjectId();
    const branchStaffId = new mongoose_1.Types.ObjectId();
    const supportAgentId = new mongoose_1.Types.ObjectId();
    const branchOperationsOfficerId = new mongoose_1.Types.ObjectId();
    await StaffModel.insertMany([
        {
            _id: adminStaffId,
            staffNumber: 'STF-2001',
            fullName: 'Zelalem Bemintu',
            identifier: 'zelalem.bemintu@bunna.com',
            phone: '0911001001',
            email: 'zelalem.bemintu@bunna.com',
            role: enums_1.UserRole.ADMIN,
            passwordHash: hashSecret('Bunna123!'),
            isActive: true,
        },
        {
            _id: headOfficeManagerId,
            staffNumber: 'STF-2007',
            fullName: 'Aster Mengistu',
            identifier: 'admin@bunna.local',
            phone: '0911001007',
            email: 'admin@bunna.local',
            role: enums_1.UserRole.HEAD_OFFICE_MANAGER,
            passwordHash: hashSecret('Bunna123!'),
            isActive: true,
        },
        {
            _id: districtStaffId,
            staffNumber: 'STF-2004',
            fullName: 'Mulugeta Tadesse',
            identifier: 'district.demo',
            phone: '0911001002',
            email: 'mulugeta@cbe-bank.local',
            role: enums_1.UserRole.DISTRICT_MANAGER,
            districtId: bahirDarDistrictId,
            passwordHash: hashSecret('demo-pass'),
            isActive: true,
        },
        {
            _id: branchStaffId,
            staffNumber: 'STF-2005',
            fullName: 'Hana Worku',
            identifier: 'branch.demo',
            phone: '0911001003',
            email: 'hana@cbe-bank.local',
            role: enums_1.UserRole.BRANCH_MANAGER,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            passwordHash: hashSecret('demo-pass'),
            isActive: true,
        },
        {
            _id: supportAgentId,
            staffNumber: 'STF-2006',
            fullName: 'Rahel Desta',
            identifier: 'support.demo',
            phone: '0911001006',
            email: 'support@cbe-bank.local',
            role: enums_1.UserRole.SUPPORT_AGENT,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            passwordHash: hashSecret('demo-pass'),
            isActive: true,
        },
        {
            _id: branchLoanOfficerId,
            staffNumber: 'STF-2002',
            fullName: 'Getachew Molla',
            identifier: 'loan.branch.demo',
            phone: '0911001004',
            email: 'getachew@cbe-bank.local',
            role: enums_1.UserRole.LOAN_OFFICER,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            passwordHash: hashSecret('demo-pass'),
            isActive: true,
        },
        {
            _id: branchOperationsOfficerId,
            staffNumber: 'STF-2008',
            fullName: 'Saron Tefera',
            identifier: 'ops.branch.demo',
            phone: '0911001008',
            email: 'saron@cbe-bank.local',
            role: enums_1.UserRole.LOAN_OFFICER,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            passwordHash: hashSecret('demo-pass'),
            isActive: true,
        },
        {
            _id: districtLoanOfficerId,
            staffNumber: 'STF-2003',
            fullName: 'Tigist Yimer',
            identifier: 'loan.district.demo',
            phone: '0911001005',
            email: 'tigist@cbe-bank.local',
            role: enums_1.UserRole.LOAN_OFFICER,
            branchId: gondarBranchId,
            districtId: gondarDistrictId,
            passwordHash: hashSecret('demo-pass'),
            isActive: true,
        },
    ]);
    const shareholderMemberId = new mongoose_1.Types.ObjectId();
    const secondShareholderMemberId = new mongoose_1.Types.ObjectId();
    const regularMemberId = new mongoose_1.Types.ObjectId();
    const secondRegularMemberId = new mongoose_1.Types.ObjectId();
    const thirdRegularMemberId = new mongoose_1.Types.ObjectId();
    await MemberModel.insertMany([
        {
            _id: shareholderMemberId,
            customerId: 'CUST-1001',
            memberNumber: 'MBR-1001',
            memberType: enums_1.MemberType.SHAREHOLDER,
            role: enums_1.UserRole.SHAREHOLDER_MEMBER,
            fullName: 'Abebe Kebede',
            firstName: 'Abebe',
            lastName: 'Kebede',
            phone: '0911000001',
            email: 'abebe@cbe-bank.local',
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            shareBalance: 250000,
            kycStatus: 'verified',
            passwordHash: 'demo-pass',
            pinHash: hashSecret('1234'),
            isActive: true,
        },
        {
            _id: secondShareholderMemberId,
            customerId: 'CUST-1002',
            memberNumber: 'MBR-1002',
            memberType: enums_1.MemberType.SHAREHOLDER,
            role: enums_1.UserRole.SHAREHOLDER_MEMBER,
            fullName: 'Tirunesh Bekele',
            firstName: 'Tirunesh',
            lastName: 'Bekele',
            phone: '0911000002',
            email: 'tirunesh@cbe-bank.local',
            branchId: debreMarkosBranchId,
            districtId: bahirDarDistrictId,
            shareBalance: 180000,
            kycStatus: 'verified',
            passwordHash: 'demo-pass',
            pinHash: hashSecret('1234'),
            isActive: true,
        },
        {
            _id: regularMemberId,
            customerId: 'CUST-1003',
            memberNumber: 'MBR-1003',
            memberType: enums_1.MemberType.MEMBER,
            role: enums_1.UserRole.MEMBER,
            fullName: 'Meseret Alemu',
            firstName: 'Meseret',
            lastName: 'Alemu',
            phone: '0911000003',
            email: 'meseret@cbe-bank.local',
            branchId: gondarBranchId,
            districtId: gondarDistrictId,
            shareBalance: 0,
            kycStatus: 'pending_review',
            passwordHash: 'demo-pass',
            pinHash: hashSecret('1234'),
            isActive: true,
        },
        {
            _id: secondRegularMemberId,
            customerId: 'CUST-1004',
            memberNumber: 'MBR-1004',
            memberType: enums_1.MemberType.MEMBER,
            role: enums_1.UserRole.MEMBER,
            fullName: 'Yohannes Worku',
            firstName: 'Yohannes',
            lastName: 'Worku',
            phone: '0911000004',
            email: 'yohannes@cbe-bank.local',
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            shareBalance: 0,
            kycStatus: 'verified',
            passwordHash: 'demo-pass',
            pinHash: hashSecret('1234'),
            isActive: true,
        },
        {
            _id: thirdRegularMemberId,
            customerId: 'CUST-1005',
            memberNumber: 'MBR-1005',
            memberType: enums_1.MemberType.MEMBER,
            role: enums_1.UserRole.MEMBER,
            fullName: 'Lulit Haile',
            firstName: 'Lulit',
            lastName: 'Haile',
            phone: '0911000005',
            email: 'lulit@cbe-bank.local',
            branchId: debreMarkosBranchId,
            districtId: bahirDarDistrictId,
            shareBalance: 0,
            kycStatus: 'verified',
            passwordHash: 'demo-pass',
            pinHash: hashSecret('1234'),
            isActive: true,
        },
    ]);
    const shareholderSavingsId = new mongoose_1.Types.ObjectId();
    const secondShareholderSavingsId = new mongoose_1.Types.ObjectId();
    const regularSavingsId = new mongoose_1.Types.ObjectId();
    const secondRegularSavingsId = new mongoose_1.Types.ObjectId();
    const thirdRegularSavingsId = new mongoose_1.Types.ObjectId();
    await SavingsAccountModel.insertMany([
        {
            _id: shareholderSavingsId,
            accountNumber: '10023489',
            memberId: shareholderMemberId,
            branchId: bahirDarBranchId,
            balance: 186400,
            currency: 'ETB',
            isActive: true,
        },
        {
            _id: secondShareholderSavingsId,
            accountNumber: '10023999',
            memberId: secondShareholderMemberId,
            branchId: debreMarkosBranchId,
            balance: 143500,
            currency: 'ETB',
            isActive: true,
        },
        {
            _id: regularSavingsId,
            accountNumber: '10024567',
            memberId: regularMemberId,
            branchId: gondarBranchId,
            balance: 74250,
            currency: 'ETB',
            isActive: true,
        },
        {
            _id: secondRegularSavingsId,
            accountNumber: '10026789',
            memberId: secondRegularMemberId,
            branchId: bahirDarBranchId,
            balance: 22500,
            currency: 'ETB',
            isActive: true,
        },
        {
            _id: thirdRegularSavingsId,
            accountNumber: '10027890',
            memberId: thirdRegularMemberId,
            branchId: debreMarkosBranchId,
            balance: 51800,
            currency: 'ETB',
            isActive: true,
        },
    ]);
    const schoolPaymentTransactionId = new mongoose_1.Types.ObjectId();
    await TransactionModel.insertMany([
        {
            _id: schoolPaymentTransactionId,
            transactionReference: 'TXN-DEMO-2026-001',
            memberId: shareholderMemberId,
            accountId: shareholderSavingsId,
            branchId: bahirDarBranchId,
            type: enums_1.PaymentType.SCHOOL_PAYMENT,
            channel: 'mobile',
            amount: 1500,
            currency: 'ETB',
            narration: 'Term payment',
            createdAt: new Date('2026-03-01T09:00:00.000Z'),
            updatedAt: new Date('2026-03-01T09:00:00.000Z'),
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            transactionReference: 'TXN-DEMO-2026-002',
            memberId: shareholderMemberId,
            accountId: shareholderSavingsId,
            branchId: bahirDarBranchId,
            type: enums_1.PaymentType.DEPOSIT,
            channel: 'branch',
            amount: 12000,
            currency: 'ETB',
            narration: 'Cash deposit',
            createdAt: new Date('2026-02-24T09:00:00.000Z'),
            updatedAt: new Date('2026-02-24T09:00:00.000Z'),
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            transactionReference: 'TXN-DEMO-2026-003',
            memberId: shareholderMemberId,
            accountId: shareholderSavingsId,
            branchId: bahirDarBranchId,
            type: enums_1.PaymentType.TRANSFER,
            channel: 'mobile',
            amount: 2450,
            currency: 'ETB',
            narration: 'Internal transfer',
            createdAt: new Date('2026-02-20T09:00:00.000Z'),
            updatedAt: new Date('2026-02-20T09:00:00.000Z'),
        },
    ]);
    await SchoolPaymentModel.create({
        transactionId: schoolPaymentTransactionId,
        memberId: shareholderMemberId,
        accountId: shareholderSavingsId,
        branchId: bahirDarBranchId,
        studentId: 'ST-1001',
        schoolName: 'Blue Nile Academy',
        amount: 1500,
        channel: 'mobile',
        status: 'successful',
        createdAt: new Date('2026-03-01T09:00:00.000Z'),
        updatedAt: new Date('2026-03-01T09:00:00.000Z'),
    });
    await LoanModel.insertMany([
        {
            _id: new mongoose_1.Types.ObjectId(),
            memberId: shareholderMemberId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            loanType: 'Business Loan',
            amount: 500000,
            interestRate: 13,
            termMonths: 24,
            purpose: 'Working capital',
            status: enums_1.LoanStatus.BRANCH_REVIEW,
            currentLevel: enums_1.LoanWorkflowLevel.BRANCH,
            assignedToStaffId: branchLoanOfficerId,
            createdAt: new Date('2026-03-02T09:00:00.000Z'),
            updatedAt: new Date('2026-03-02T09:00:00.000Z'),
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            memberId: regularMemberId,
            branchId: gondarBranchId,
            districtId: gondarDistrictId,
            loanType: 'School Expansion Loan',
            amount: 1200000,
            interestRate: 12,
            termMonths: 36,
            purpose: 'Expansion',
            status: enums_1.LoanStatus.APPROVED,
            currentLevel: enums_1.LoanWorkflowLevel.HEAD_OFFICE,
            assignedToStaffId: districtLoanOfficerId,
            createdAt: new Date('2026-02-10T09:00:00.000Z'),
            updatedAt: new Date('2026-02-15T09:00:00.000Z'),
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            memberId: secondShareholderMemberId,
            branchId: debreMarkosBranchId,
            districtId: bahirDarDistrictId,
            loanType: 'Agriculture Loan',
            amount: 24000000,
            interestRate: 11,
            termMonths: 48,
            purpose: 'Farm equipment',
            status: enums_1.LoanStatus.DISTRICT_REVIEW,
            currentLevel: enums_1.LoanWorkflowLevel.DISTRICT,
            assignedToStaffId: districtLoanOfficerId,
            createdAt: new Date('2026-02-18T09:00:00.000Z'),
            updatedAt: new Date('2026-02-22T09:00:00.000Z'),
        },
    ]);
    await NotificationModel.insertMany([
        {
            _id: new mongoose_1.Types.ObjectId(),
            userType: 'member',
            userId: shareholderMemberId,
            userRole: enums_1.UserRole.SHAREHOLDER_MEMBER,
            type: enums_1.NotificationType.LOAN_STATUS,
            status: enums_1.NotificationStatus.SENT,
            title: 'Loan Update',
            message: 'Your business loan is under branch review.',
            entityType: 'loan',
            createdAt: new Date('2026-03-09T10:30:00.000Z'),
            updatedAt: new Date('2026-03-09T10:30:00.000Z'),
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            userType: 'member',
            userId: shareholderMemberId,
            userRole: enums_1.UserRole.SHAREHOLDER_MEMBER,
            type: enums_1.NotificationType.PAYMENT,
            status: enums_1.NotificationStatus.READ,
            title: 'School Payment Successful',
            message: 'Your payment has been recorded successfully.',
            entityType: 'school_payment',
            readAt: new Date('2026-03-09T09:15:00.000Z'),
            createdAt: new Date('2026-03-09T09:15:00.000Z'),
            updatedAt: new Date('2026-03-09T09:15:00.000Z'),
        },
    ]);
    const voteId = new mongoose_1.Types.ObjectId();
    await VoteModel.create({
        _id: voteId,
        title: 'Board Election 2026',
        description: 'Annual shareholder election',
        type: 'election',
        status: enums_1.VoteStatus.OPEN,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T23:59:59.000Z'),
        createdBy: adminStaffId,
    });
    await VoteOptionModel.insertMany([
        {
            _id: new mongoose_1.Types.ObjectId(),
            voteId,
            name: 'Candidate A',
            description: 'Finance expert',
            displayOrder: 1,
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            voteId,
            name: 'Candidate B',
            description: 'Operations specialist',
            displayOrder: 2,
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            voteId,
            name: 'Candidate C',
            description: 'Technology leader',
            displayOrder: 3,
        },
    ]);
    const dashboardToday = new Date('2026-03-11T00:00:00.000Z');
    const dashboardWeekStart = new Date('2026-03-09T00:00:00.000Z');
    const dashboardMonthStart = new Date('2026-03-01T00:00:00.000Z');
    const dashboardYearStart = new Date('2026-01-01T00:00:00.000Z');
    await StaffPerformanceDailyModel.insertMany([
        buildStaffPerformanceRecord({
            staffId: branchLoanOfficerId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardToday,
            membersServed: 34,
            customersHelped: 31,
            loansHandled: 12,
            loanApplicationsCount: 12,
            loanApprovedCount: 6,
            loanRejectedCount: 1,
            loansEscalated: 2,
            kycCompleted: 9,
            supportResolved: 4,
            tasksCompleted: 28,
            transactionsCount: 42,
            schoolPaymentsCount: 5,
            totalTransactionAmount: 186000,
            avgHandlingTime: 17,
            responseTimeMinutes: 11,
            pendingTasks: 5,
            score: 92,
        }),
        buildStaffPerformanceRecord({
            staffId: supportAgentId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardToday,
            membersServed: 21,
            customersHelped: 24,
            loansHandled: 3,
            loanApplicationsCount: 3,
            loanApprovedCount: 1,
            loanRejectedCount: 0,
            loansEscalated: 1,
            kycCompleted: 5,
            supportResolved: 13,
            tasksCompleted: 19,
            transactionsCount: 18,
            schoolPaymentsCount: 2,
            totalTransactionAmount: 64000,
            avgHandlingTime: 21,
            responseTimeMinutes: 8,
            pendingTasks: 4,
            score: 84,
        }),
        buildStaffPerformanceRecord({
            staffId: branchOperationsOfficerId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardToday,
            membersServed: 13,
            customersHelped: 16,
            loansHandled: 4,
            loanApplicationsCount: 4,
            loanApprovedCount: 1,
            loanRejectedCount: 1,
            loansEscalated: 2,
            kycCompleted: 3,
            supportResolved: 2,
            tasksCompleted: 11,
            transactionsCount: 14,
            schoolPaymentsCount: 1,
            totalTransactionAmount: 28000,
            avgHandlingTime: 33,
            responseTimeMinutes: 22,
            pendingTasks: 9,
            score: 57,
        }),
    ]);
    await StaffPerformanceWeeklyModel.insertMany([
        buildStaffPerformanceRecord({
            staffId: branchLoanOfficerId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardWeekStart,
            membersServed: 188,
            customersHelped: 176,
            loansHandled: 48,
            loanApplicationsCount: 48,
            loanApprovedCount: 24,
            loanRejectedCount: 4,
            loansEscalated: 8,
            kycCompleted: 41,
            supportResolved: 20,
            tasksCompleted: 131,
            transactionsCount: 242,
            schoolPaymentsCount: 18,
            totalTransactionAmount: 1024000,
            avgHandlingTime: 18,
            responseTimeMinutes: 12,
            pendingTasks: 6,
            score: 91,
        }),
        buildStaffPerformanceRecord({
            staffId: supportAgentId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardWeekStart,
            membersServed: 124,
            customersHelped: 136,
            loansHandled: 14,
            loanApplicationsCount: 14,
            loanApprovedCount: 5,
            loanRejectedCount: 1,
            loansEscalated: 3,
            kycCompleted: 22,
            supportResolved: 67,
            tasksCompleted: 104,
            transactionsCount: 97,
            schoolPaymentsCount: 6,
            totalTransactionAmount: 324000,
            avgHandlingTime: 19,
            responseTimeMinutes: 9,
            pendingTasks: 5,
            score: 86,
        }),
        buildStaffPerformanceRecord({
            staffId: branchOperationsOfficerId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardWeekStart,
            membersServed: 79,
            customersHelped: 85,
            loansHandled: 19,
            loanApplicationsCount: 19,
            loanApprovedCount: 6,
            loanRejectedCount: 5,
            loansEscalated: 7,
            kycCompleted: 14,
            supportResolved: 11,
            tasksCompleted: 58,
            transactionsCount: 82,
            schoolPaymentsCount: 4,
            totalTransactionAmount: 208000,
            avgHandlingTime: 28,
            responseTimeMinutes: 19,
            pendingTasks: 10,
            score: 61,
        }),
    ]);
    await StaffPerformanceMonthlyModel.insertMany([
        buildStaffPerformanceRecord({
            staffId: branchLoanOfficerId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardMonthStart,
            membersServed: 724,
            customersHelped: 703,
            loansHandled: 173,
            loanApplicationsCount: 173,
            loanApprovedCount: 88,
            loanRejectedCount: 13,
            loansEscalated: 24,
            kycCompleted: 162,
            supportResolved: 79,
            tasksCompleted: 511,
            transactionsCount: 956,
            schoolPaymentsCount: 64,
            totalTransactionAmount: 4184000,
            avgHandlingTime: 18,
            responseTimeMinutes: 13,
            pendingTasks: 7,
            score: 90,
        }),
        buildStaffPerformanceRecord({
            staffId: supportAgentId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardMonthStart,
            membersServed: 506,
            customersHelped: 548,
            loansHandled: 43,
            loanApplicationsCount: 43,
            loanApprovedCount: 15,
            loanRejectedCount: 4,
            loansEscalated: 8,
            kycCompleted: 93,
            supportResolved: 254,
            tasksCompleted: 407,
            transactionsCount: 385,
            schoolPaymentsCount: 22,
            totalTransactionAmount: 1422000,
            avgHandlingTime: 20,
            responseTimeMinutes: 9,
            pendingTasks: 6,
            score: 85,
        }),
        buildStaffPerformanceRecord({
            staffId: branchOperationsOfficerId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardMonthStart,
            membersServed: 303,
            customersHelped: 321,
            loansHandled: 68,
            loanApplicationsCount: 68,
            loanApprovedCount: 20,
            loanRejectedCount: 17,
            loansEscalated: 22,
            kycCompleted: 57,
            supportResolved: 41,
            tasksCompleted: 219,
            transactionsCount: 314,
            schoolPaymentsCount: 17,
            totalTransactionAmount: 866000,
            avgHandlingTime: 29,
            responseTimeMinutes: 18,
            pendingTasks: 11,
            score: 60,
        }),
    ]);
    await StaffPerformanceYearlyModel.insertMany([
        buildStaffPerformanceRecord({
            staffId: branchLoanOfficerId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardYearStart,
            membersServed: 2146,
            customersHelped: 2088,
            loansHandled: 511,
            loanApplicationsCount: 511,
            loanApprovedCount: 262,
            loanRejectedCount: 41,
            loansEscalated: 77,
            kycCompleted: 471,
            supportResolved: 236,
            tasksCompleted: 1544,
            transactionsCount: 2824,
            schoolPaymentsCount: 181,
            totalTransactionAmount: 12230000,
            avgHandlingTime: 18,
            responseTimeMinutes: 13,
            pendingTasks: 7,
            score: 89,
        }),
        buildStaffPerformanceRecord({
            staffId: supportAgentId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardYearStart,
            membersServed: 1487,
            customersHelped: 1568,
            loansHandled: 131,
            loanApplicationsCount: 131,
            loanApprovedCount: 46,
            loanRejectedCount: 11,
            loansEscalated: 28,
            kycCompleted: 281,
            supportResolved: 771,
            tasksCompleted: 1187,
            transactionsCount: 1114,
            schoolPaymentsCount: 73,
            totalTransactionAmount: 4312000,
            avgHandlingTime: 19,
            responseTimeMinutes: 10,
            pendingTasks: 6,
            score: 84,
        }),
        buildStaffPerformanceRecord({
            staffId: branchOperationsOfficerId,
            branchId: bahirDarBranchId,
            districtId: bahirDarDistrictId,
            periodStart: dashboardYearStart,
            membersServed: 931,
            customersHelped: 988,
            loansHandled: 209,
            loanApplicationsCount: 209,
            loanApprovedCount: 61,
            loanRejectedCount: 44,
            loansEscalated: 66,
            kycCompleted: 182,
            supportResolved: 137,
            tasksCompleted: 699,
            transactionsCount: 972,
            schoolPaymentsCount: 47,
            totalTransactionAmount: 2527000,
            avgHandlingTime: 27,
            responseTimeMinutes: 18,
            pendingTasks: 12,
            score: 59,
        }),
    ]);
    await BranchPerformanceDailyModel.insertMany(buildDailyPerformanceSeries([
        {
            branchId: bahirDarBranchId,
            branchName: 'Bahir Dar Branch',
            districtId: bahirDarDistrictId,
            districtName: 'Bahir Dar District',
            seed: {
                membersServed: 72,
                customersHelped: 68,
                loansHandled: 18,
                loansApproved: 9,
                loansEscalated: 3,
                kycCompleted: 15,
                supportResolved: 19,
                transactionsProcessed: 88,
                avgHandlingTime: 18,
                pendingTasks: 8,
                pendingApprovals: 6,
                responseTimeMinutes: 12,
                score: 91,
            },
        },
        {
            branchId: debreMarkosBranchId,
            branchName: 'Debre Markos Branch',
            districtId: bahirDarDistrictId,
            districtName: 'Bahir Dar District',
            seed: {
                membersServed: 46,
                customersHelped: 42,
                loansHandled: 11,
                loansApproved: 5,
                loansEscalated: 4,
                kycCompleted: 10,
                supportResolved: 11,
                transactionsProcessed: 61,
                avgHandlingTime: 24,
                pendingTasks: 11,
                pendingApprovals: 8,
                responseTimeMinutes: 17,
                score: 68,
            },
        },
        {
            branchId: gondarBranchId,
            branchName: 'Gondar Branch',
            districtId: gondarDistrictId,
            districtName: 'Gondar District',
            seed: {
                membersServed: 38,
                customersHelped: 35,
                loansHandled: 9,
                loansApproved: 3,
                loansEscalated: 5,
                kycCompleted: 7,
                supportResolved: 8,
                transactionsProcessed: 48,
                avgHandlingTime: 29,
                pendingTasks: 13,
                pendingApprovals: 10,
                responseTimeMinutes: 21,
                score: 56,
            },
        },
    ]));
    await DistrictPerformanceDailyModel.insertMany(buildDailyPerformanceSeries([
        {
            districtId: bahirDarDistrictId,
            districtName: 'Bahir Dar District',
            seed: {
                membersServed: 118,
                customersHelped: 110,
                loansHandled: 29,
                loansApproved: 14,
                loansEscalated: 7,
                kycCompleted: 25,
                supportResolved: 30,
                transactionsProcessed: 149,
                avgHandlingTime: 20,
                pendingTasks: 18,
                pendingApprovals: 14,
                responseTimeMinutes: 14,
                score: 82,
            },
        },
        {
            districtId: gondarDistrictId,
            districtName: 'Gondar District',
            seed: {
                membersServed: 38,
                customersHelped: 35,
                loansHandled: 9,
                loansApproved: 3,
                loansEscalated: 5,
                kycCompleted: 7,
                supportResolved: 8,
                transactionsProcessed: 48,
                avgHandlingTime: 29,
                pendingTasks: 13,
                pendingApprovals: 10,
                responseTimeMinutes: 21,
                score: 56,
            },
        },
    ]));
    const openConversationId = new mongoose_1.Types.ObjectId();
    const assignedConversationId = new mongoose_1.Types.ObjectId();
    const resolvedConversationId = new mongoose_1.Types.ObjectId();
    await ChatConversationModel.insertMany([
        {
            _id: openConversationId,
            memberId: regularMemberId,
            memberName: 'Tigist Bekele',
            phoneNumber: '0911000003',
            memberType: enums_1.MemberType.MEMBER,
            branchId: bahirDarBranchId,
            branchName: 'Bahir Dar Branch',
            districtId: bahirDarDistrictId,
            districtName: 'Bahir Dar District',
            category: 'loan_issue',
            status: 'waiting_agent',
            priority: 'high',
            channel: 'mobile',
            escalationFlag: false,
            lastMessageAt: new Date('2026-03-11T11:20:00.000Z'),
            createdAt: new Date('2026-03-11T11:10:00.000Z'),
            updatedAt: new Date('2026-03-11T11:20:00.000Z'),
        },
        {
            _id: assignedConversationId,
            memberId: shareholderMemberId,
            memberName: 'Abebe Kebede',
            phoneNumber: '0911000001',
            memberType: enums_1.MemberType.SHAREHOLDER,
            branchId: bahirDarBranchId,
            branchName: 'Bahir Dar Branch',
            districtId: bahirDarDistrictId,
            districtName: 'Bahir Dar District',
            category: 'payment_issue',
            status: 'waiting_customer',
            assignedToStaffId: supportAgentId,
            assignedToStaffName: 'Rahel Desta',
            priority: 'normal',
            channel: 'mobile',
            escalationFlag: false,
            lastMessageAt: new Date('2026-03-11T10:55:00.000Z'),
            createdAt: new Date('2026-03-11T10:10:00.000Z'),
            updatedAt: new Date('2026-03-11T10:55:00.000Z'),
        },
        {
            _id: resolvedConversationId,
            memberId: secondRegularMemberId,
            memberName: 'Meseret Alemu',
            phoneNumber: '0911000004',
            memberType: enums_1.MemberType.MEMBER,
            branchId: gondarBranchId,
            branchName: 'Gondar Branch',
            districtId: gondarDistrictId,
            districtName: 'Gondar District',
            category: 'kyc_issue',
            status: 'resolved',
            assignedToStaffId: supportAgentId,
            assignedToStaffName: 'Rahel Desta',
            priority: 'low',
            channel: 'mobile',
            escalationFlag: false,
            lastMessageAt: new Date('2026-03-10T16:35:00.000Z'),
            createdAt: new Date('2026-03-10T16:00:00.000Z'),
            updatedAt: new Date('2026-03-10T16:35:00.000Z'),
        },
    ]);
    await ChatMessageModel.insertMany([
        {
            _id: new mongoose_1.Types.ObjectId(),
            conversationId: openConversationId,
            senderType: 'customer',
            senderId: regularMemberId.toString(),
            senderName: 'Tigist Bekele',
            message: 'I submitted my loan documents but I need an update on the next review step.',
            messageType: 'text',
            createdAt: new Date('2026-03-11T11:20:00.000Z'),
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            conversationId: assignedConversationId,
            senderType: 'customer',
            senderId: shareholderMemberId.toString(),
            senderName: 'Abebe Kebede',
            message: 'My payment confirmation is delayed. Can you check it?',
            messageType: 'text',
            createdAt: new Date('2026-03-11T10:15:00.000Z'),
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            conversationId: assignedConversationId,
            senderType: 'agent',
            senderId: supportAgentId.toString(),
            senderName: 'Rahel Desta',
            message: 'I am reviewing the payment reference now. Please keep this chat open for the update.',
            messageType: 'text',
            createdAt: new Date('2026-03-11T10:55:00.000Z'),
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            conversationId: resolvedConversationId,
            senderType: 'customer',
            senderId: secondRegularMemberId.toString(),
            senderName: 'Meseret Alemu',
            message: 'My KYC review is still pending.',
            messageType: 'text',
            createdAt: new Date('2026-03-10T16:02:00.000Z'),
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            conversationId: resolvedConversationId,
            senderType: 'agent',
            senderId: supportAgentId.toString(),
            senderName: 'Rahel Desta',
            message: 'Your KYC record has been reviewed and the case is now resolved.',
            messageType: 'text',
            createdAt: new Date('2026-03-10T16:35:00.000Z'),
        },
    ]);
    await ChatAssignmentModel.insertMany([
        {
            _id: new mongoose_1.Types.ObjectId(),
            conversationId: assignedConversationId,
            assignedToStaffId: supportAgentId,
            assignedBy: adminStaffId,
            createdAt: new Date('2026-03-11T10:30:00.000Z'),
        },
        {
            _id: new mongoose_1.Types.ObjectId(),
            conversationId: resolvedConversationId,
            assignedToStaffId: supportAgentId,
            assignedBy: adminStaffId,
            createdAt: new Date('2026-03-10T16:05:00.000Z'),
        },
    ]);
    console.log(JSON.stringify({
        seeded: true,
        mongoUri,
        memberLogins: [
            { phone: '0911000001', password: 'demo-pass', type: 'shareholder' },
            { phone: '0911000002', password: 'demo-pass', type: 'shareholder' },
            { phone: '0911000003', password: 'demo-pass', type: 'member' },
            { phone: '0911000004', password: 'demo-pass', type: 'member' },
            { phone: '0911000005', password: 'demo-pass', type: 'member' },
        ],
        staffLogins: [
            {
                identifier: 'zelalem.bemintu@bunna.com',
                password: 'Bunna123!',
                role: 'admin',
            },
            {
                identifier: 'admin@bunna.local',
                password: 'Bunna123!',
                role: 'head_office_manager',
            },
            {
                identifier: 'admin',
                password: 'Bunna123!',
                role: 'head_office_manager_alias',
            },
            {
                identifier: 'head_office',
                password: 'Bunna123!',
                role: 'head_office_manager_alias',
            },
            {
                identifier: 'loan.branch.demo',
                password: 'demo-pass',
                role: 'loan_officer',
            },
            {
                identifier: 'loan.district.demo',
                password: 'demo-pass',
                role: 'loan_officer',
            },
            {
                identifier: 'district.demo',
                password: 'demo-pass',
                role: 'district_manager',
            },
            {
                identifier: 'branch.demo',
                password: 'demo-pass',
                role: 'branch_manager',
            },
            {
                identifier: 'support.demo',
                password: 'demo-pass',
                role: 'support_agent',
            },
            {
                identifier: 'ops.branch.demo',
                password: 'demo-pass',
                role: 'loan_officer',
            },
        ],
        summary: {
            districts: 2,
            branches: 3,
            staff: 8,
            regularMembers: 3,
            shareholderMembers: 2,
            activeVotes: 1,
            supportConversations: 3,
        },
    }, null, 2));
}
function createModel(name, schema) {
    return mongoose_1.default.models[name] || mongoose_1.default.model(name, schema);
}
function buildStaffPerformanceRecord(input) {
    return {
        ...input,
        status: resolvePerformanceStatus(input.score),
    };
}
function buildDailyPerformanceSeries(configs) {
    const rows = [];
    for (let dayOffset = 0; dayOffset < 35; dayOffset += 1) {
        const date = new Date('2026-03-11T00:00:00.000Z');
        date.setUTCDate(date.getUTCDate() - dayOffset);
        const variance = dayOffset % 5;
        for (const config of configs) {
            const multiplier = dayOffset < 7 ? 1 : dayOffset < 31 ? 0.92 : 0.87;
            const adjustment = variance === 0 ? 0 : variance === 1 ? 2 : variance === 2 ? -1 : 1;
            const score = Math.max(45, Math.round(config.seed.score * multiplier + adjustment));
            rows.push({
                ...('branchId' in config
                    ? {
                        branchId: config.branchId,
                        branchName: config.branchName,
                        districtId: config.districtId,
                        districtName: config.districtName,
                    }
                    : {
                        districtId: config.districtId,
                        districtName: config.districtName,
                    }),
                date,
                membersServed: Math.max(8, Math.round(config.seed.membersServed * multiplier + adjustment)),
                customersHelped: Math.max(8, Math.round(config.seed.customersHelped * multiplier + adjustment)),
                loansHandled: Math.max(1, Math.round(config.seed.loansHandled * multiplier)),
                loansApproved: Math.max(0, Math.round(config.seed.loansApproved * multiplier)),
                loansEscalated: Math.max(0, Math.round(config.seed.loansEscalated * multiplier)),
                kycCompleted: Math.max(0, Math.round(config.seed.kycCompleted * multiplier)),
                supportResolved: Math.max(0, Math.round(config.seed.supportResolved * multiplier)),
                transactionsProcessed: Math.max(6, Math.round(config.seed.transactionsProcessed * multiplier + adjustment)),
                avgHandlingTime: Number((config.seed.avgHandlingTime + variance * 0.8).toFixed(1)),
                pendingTasks: Math.max(1, Math.round(config.seed.pendingTasks * multiplier + variance)),
                pendingApprovals: Math.max(1, Math.round(config.seed.pendingApprovals * multiplier + (variance - 1))),
                responseTimeMinutes: Number((config.seed.responseTimeMinutes + variance * 0.6).toFixed(1)),
                score,
                status: resolvePerformanceStatus(score),
            });
        }
    }
    return rows;
}
function resolvePerformanceStatus(score) {
    if (score >= 88) {
        return 'excellent';
    }
    if (score >= 72) {
        return 'good';
    }
    if (score >= 58) {
        return 'watch';
    }
    return 'needs_support';
}
function loadSeedEnvironment() {
    const rootDir = process.cwd();
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    const envFiles = [
        `.env.${nodeEnv}.local`,
        `.env.${nodeEnv}`,
        '.env.local',
        '.env',
    ];
    for (const envFile of envFiles) {
        const envPath = (0, path_1.resolve)(rootDir, envFile);
        if ((0, fs_1.existsSync)(envPath)) {
            (0, dotenv_1.config)({ path: envPath, override: false });
        }
    }
}
function hashSecret(value) {
    return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
}
void run()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await mongoose_1.default.disconnect();
});
//# sourceMappingURL=seed-demo.js.map