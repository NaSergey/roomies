import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class LocationDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  cityId!: number;

  @ApiProperty({ required: false, type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  districtIds?: number[];
}
