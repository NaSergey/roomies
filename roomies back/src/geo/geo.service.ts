import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  getCities() {
    return this.prisma.city.findMany({ orderBy: { name: 'asc' } });
  }

  getDistricts(cityId: number) {
    return this.prisma.district.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
    });
  }
}
