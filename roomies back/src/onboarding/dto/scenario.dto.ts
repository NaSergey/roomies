import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class ScenarioDto {
  @ApiProperty({
    enum: [
      'looking_housing_roomie',
      'has_housing_seeking_roomie',
      'looking_roomie_find_housing',
      'squad',
    ],
  })
  @IsEnum([
    'looking_housing_roomie',
    'has_housing_seeking_roomie',
    'looking_roomie_find_housing',
    'squad',
  ])
  scenario!: string;
}
