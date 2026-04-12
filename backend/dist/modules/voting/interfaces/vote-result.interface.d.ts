import { VoteStatus } from '../../../common/enums';
export interface VoteSummaryResult {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: VoteStatus;
    startDate: Date;
    endDate: Date;
}
export interface VoteOptionResult {
    id: string;
    voteId: string;
    name: string;
    description?: string;
    displayOrder: number;
}
export interface VoteDetailResult extends VoteSummaryResult {
    options: VoteOptionResult[];
}
export interface VoteResultsBreakdown {
    optionId: string;
    optionName: string;
    votes: number;
    percentage: number;
}
export interface VoteParticipationBreakdownItem {
    id: string;
    name: string;
    totalResponses: number;
}
export interface VoteParticipationResult {
    totalResponses: number;
    uniqueBranches: number;
    uniqueDistricts: number;
    eligibleShareholders: number;
    participationRate: number;
    branchParticipation: VoteParticipationBreakdownItem[];
    districtParticipation: VoteParticipationBreakdownItem[];
}
export interface VoteAdminListItem extends VoteSummaryResult {
    totalResponses: number;
    participationRate: number;
    eligibleShareholders: number;
}
