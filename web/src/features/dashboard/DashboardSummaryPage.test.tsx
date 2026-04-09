import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppClientContext } from '../../app/AppContext';
import { AdminRole, type AdminSession } from '../../core/session';
import { DashboardSummaryPage } from './DashboardSummaryPage';

describe('DashboardSummaryPage', () => {
  it('loads and renders dashboard summary data', async () => {
    const session: AdminSession = {
      userId: 'staff_1',
      fullName: 'Selamawit Assefa',
      role: AdminRole.ADMIN,
      branchName: 'Head Office',
    };

    render(
      <AppClientContext.Provider
        value={{
          authApi: {
            login: vi.fn(),
          },
          dashboardApi: {
            getSummary: vi.fn().mockResolvedValue({
              customersServed: 1284,
              transactionsCount: 8420,
              schoolPaymentsCount: 528,
              pendingLoansByLevel: [
                { level: 'branch_review', count: 96 },
              ],
            }),
            getBranchPerformance: vi.fn(),
            getDistrictPerformance: vi.fn(),
            getStaffRanking: vi.fn(),
            getVotingSummary: vi.fn().mockResolvedValue([
              {
                voteId: 'vote_2026',
                title: 'Board Election 2026',
                totalResponses: 78200,
                eligibleShareholders: 180000,
                participationRate: 43.44,
              },
            ]),
            getOnboardingReviewQueue: vi.fn(),
            getAutopayOperations: vi.fn(),
            updateAutopayOperation: vi.fn(),
            updateOnboardingReview: vi.fn(),
            getHeadOfficeDistrictSummary: vi.fn(),
            getHeadOfficeTopDistricts: vi.fn(),
            getHeadOfficeDistrictWatchlist: vi.fn(),
            getDistrictBranchSummary: vi.fn(),
            getDistrictTopBranches: vi.fn(),
            getDistrictBranchWatchlist: vi.fn(),
            getBranchEmployeeSummary: vi.fn(),
            getBranchTopEmployees: vi.fn(),
            getBranchEmployeeWatchlist: vi.fn(),
            getHeadOfficeCommandCenter: vi.fn().mockResolvedValue({
              totalCustomers: 284000,
              totalShareholders: 64000,
              totalSavings: 920000000,
              totalLoans: 14800,
              pendingApprovals: 23,
              riskAlerts: {
                totalAlerts: 18,
                loanAlerts: 9,
                kycAlerts: 4,
                supportAlerts: 3,
                notificationAlerts: 2,
              },
              districtPerformance: {
                scope: 'district',
                period: 'week',
                generatedAt: '2026-03-10T08:00:00.000Z',
                kpis: {
                  membersServed: 100,
                  customersHelped: 100,
                  loansHandled: 40,
                  loansApproved: 20,
                  loansEscalated: 5,
                  kycCompleted: 35,
                  supportResolved: 25,
                  transactionsProcessed: 250,
                  avgHandlingTime: 18,
                  pendingTasks: 12,
                  pendingApprovals: 8,
                  responseTimeMinutes: 14,
                  score: 82,
                  status: 'good',
                },
                items: [],
              },
              supportOverview: {
                openChats: 12,
                assignedChats: 6,
                resolvedChats: 45,
                escalatedChats: 4,
              },
              governanceStatus: {
                activeVotes: 1,
                draftVotes: 2,
                publishedVotes: 3,
                shareholderAnnouncements: 5,
              },
            }),
            getDistrictCommandCenter: vi.fn(),
            getBranchCommandCenter: vi.fn(),
          },
          votingApi: {
            getVotes: vi.fn(),
            createVote: vi.fn(),
            getParticipation: vi.fn(),
          },
          notificationApi: {
            getNotifications: vi.fn(),
            getTemplates: vi.fn(),
            getCampaigns: vi.fn(),
            createCampaign: vi.fn(),
            sendCampaign: vi.fn(),
            getLogs: vi.fn(),
            getInsuranceAlerts: vi.fn(),
          },
          recommendationApi: {
            getDashboardSummary: vi.fn().mockResolvedValue({
              recommendationsGeneratedToday: 10,
              topRecommendationType: 'customer_followup',
              completionRate: 40,
              dismissedRate: 10,
              highOpportunityCustomers: 4,
              customersMissingKyc: 3,
              customersSuitableForAutopay: 5,
            }),
            getCustomerRecommendations: vi.fn().mockResolvedValue({
              title: 'Smart Recommendations',
              recommendations: [],
            }),
            generateForCustomer: vi.fn(),
          },
          auditApi: {
            getByEntity: vi.fn(),
            getEntityAuditTrail: vi.fn(),
            getByActor: vi.fn(),
          },
          supportApi: {
            getOpenChats: vi.fn(),
            getAssignedChats: vi.fn(),
            getResolvedChats: vi.fn(),
            getChat: vi.fn(),
            assignChat: vi.fn(),
            reply: vi.fn(),
            resolve: vi.fn(),
            close: vi.fn(),
            updateStatus: vi.fn(),
          },
        }}
      >
        <DashboardSummaryPage session={session} />
      </AppClientContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('1,284')).toBeInTheDocument();
    });

    expect(screen.getByText('8,420')).toBeInTheDocument();
    expect(screen.getByText('528')).toBeInTheDocument();
    expect(screen.getByText('43%')).toBeInTheDocument();
    expect(screen.getAllByText('Branch Review').length).toBeGreaterThan(0);
    expect(screen.getByText('Live Feed')).toBeInTheDocument();
    expect(screen.getByText('Risk alert load')).toBeInTheDocument();
    expect(screen.getByText('23 approvals pending')).toBeInTheDocument();
  });
});
