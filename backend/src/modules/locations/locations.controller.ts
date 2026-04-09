import { Controller, Get, Query } from '@nestjs/common';

import { Public } from '../../common/decorators';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Public()
  @Get('regions')
  getRegions() {
    return this.locationsService.getRegions();
  }

  @Public()
  @Get('cities')
  getCities(@Query('region') region?: string) {
    return this.locationsService.getCities(region ?? 'National');
  }

  @Public()
  @Get('branches')
  getBranches(
    @Query('region') region?: string,
    @Query('city') city?: string,
  ) {
    return this.locationsService.getBranches(region, city);
  }
}
