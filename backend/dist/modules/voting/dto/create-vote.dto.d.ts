export declare class CreateVoteOptionInputDto {
    name: string;
    description?: string;
    displayOrder?: number;
}
export declare class CreateVoteDto {
    title: string;
    description: string;
    type: string;
    startDate: string;
    endDate: string;
    options: CreateVoteOptionInputDto[];
}
