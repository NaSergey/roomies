import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';

export class DealbreakersDto {
  @ApiProperty()
  @IsBoolean()
  smokingOk!: boolean;

  @ApiProperty()
  @IsBoolean()
  petsOk!: boolean;

  @ApiProperty({ enum: ['rarely', 'sometimes', 'often'] })
  @IsEnum(['rarely', 'sometimes', 'often'])
  guestsPref!: string;
}
