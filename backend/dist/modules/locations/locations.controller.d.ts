import { LocationsService } from './locations.service';
export declare class LocationsController {
    private readonly locationsService;
    constructor(locationsService: LocationsService);
    getRegions(): Promise<{
        name: string;
    }[]>;
    getCities(region?: string): Promise<{
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
