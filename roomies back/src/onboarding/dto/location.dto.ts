import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class LocationDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  cityId!: number;

  @ApiProperty({ required: false, type: [Number] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  @IsOptional()
  districtIds?: number[];
}
