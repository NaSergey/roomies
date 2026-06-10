import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('cities')
  @ApiOperation({ summary: 'Список городов' })
  getCities() {
    return this.geo.getCities();
  }

  @Get('cities/:cityId/districts')
  @ApiOperation({ summary: 'Районы города' })
  getDistricts(@Param('cityId', ParseIntPipe) cityId: number) {
    return this.geo.getDistricts(cityId);
  }
}
