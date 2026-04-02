import { AuthenticatedUser } from '../auth/interfaces';
import { ListAccountTransactionsQueryDto } from './dto';
import { SavingsService } from './savings.service';
export declare class SavingsController {
    private readonly savingsService;
    constructor(savingsService: SavingsService);
    getMyAccounts(currentUser: AuthenticatedUser): Promise<import("./interfaces").SavingsAccountDetail[]>;
    getAccountDetail(currentUser: AuthenticatedUser, accountId: string): Promise<import("./interfaces").SavingsAccountDetail>;
    getAccountTransactions(currentUser: AuthenticatedUser, accountId: string, query: ListAccountTransactionsQueryDto): Promise<import("./interfaces").TransactionHistoryItem[]>;
    getMemberAccounts(currentUser: AuthenticatedUser, memberId: string): Promise<import("./interfaces").SavingsAccountDetail[]>;
}
