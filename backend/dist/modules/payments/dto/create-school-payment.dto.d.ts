export declare class CreateSchoolPaymentDto {
    accountId: string;
    studentId: string;
    schoolName: string;
    amount: number;
    channel: 'mobile' | 'branch';
    narration?: string;
}
