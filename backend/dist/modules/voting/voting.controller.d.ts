import { AuthenticatedUser } from '../auth/interfaces';
import { CreateVoteOptionDto, CreateVoteDto, RespondToVoteDto } from './dto';
import { VotingService } from './voting.service';
export declare class VotingController {
    private readonly votingService;
    constructor(votingService: VotingService);
    getActiveVotes(): Promise<import("./interfaces").VoteSummaryResult[]>;
    getVotingEvents(): Promise<import("./interfaces").VoteSummaryResult[]>;
    getVote(voteId: string): Promise<import("./interfaces").VoteDetailResult>;
    respondToVote(currentUser: AuthenticatedUser, voteId: string, dto: RespondToVoteDto): Promise<{
        responseId: string;
        voteId: string;
        optionId: string;
        otpVerifiedAt: Date;
    }>;
    castVote(currentUser: AuthenticatedUser, dto: RespondToVoteDto & {
        voteId: string;
    }): Promise<{
        responseId: string;
        voteId: string;
        optionId: string;
        otpVerifiedAt: Date;
    }>;
    getVoteResults(voteId: string): Promise<import("./interfaces").VoteResultsBreakdown[]>;
    listVotesForAdmin(currentUser: AuthenticatedUser): Promise<import("./interfaces").VoteAdminListItem[]>;
    createVote(currentUser: AuthenticatedUser, dto: CreateVoteDto): Promise<import("./interfaces").VoteSummaryResult>;
    addVoteOption(currentUser: AuthenticatedUser, voteId: string, dto: CreateVoteOptionDto): Promise<import("./interfaces").VoteOptionResult>;
    openVote(currentUser: AuthenticatedUser, voteId: string): Promise<import("./interfaces").VoteSummaryResult>;
    closeVote(currentUser: AuthenticatedUser, voteId: string): Promise<import("./interfaces").VoteSummaryResult>;
    getParticipation(currentUser: AuthenticatedUser, voteId: string): Promise<import("./interfaces").VoteParticipationResult>;
}
