import { Model } from 'mongoose';
import { BranchDocument } from '../members/schemas/branch.schema';
export declare class LocationsService {
    private readonly branchModel;
    constructor(branchModel: Model<BranchDocument>);
    getRegions(): Promise<{
        name: string;
    }[]>;
    getCities(region: string): Promise<{
        name: string;
        region: string;
    }[]>;
    getBranches(region?: string, city?: string): Promise<{
        id: string;
        name: string;
        city: string;
        region: string;
    }[]>;
}
