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
export interface VoteParticipationResult {
    totalResponses: number;
    uniqueBranches: number;
}
export interface VoteAdminListItem extends VoteSummaryResult {
    totalResponses: number;
    participationRate: number;
}
