import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';

export class DealbreakersDto {
  // Терпимость: «мне ок, если сосед курит / держит питомца».
  @ApiProperty()
  @IsBoolean()
  smokingOk!: boolean;

  @ApiProperty()
  @IsBoolean()
  petsOk!: boolean;

  // Собственное поведение: «я курю / у меня есть питомец». Отдельно от
  // терпимости — на этой паре и считается конфликт в ленте.
  @ApiProperty()
  @IsBoolean()
  smokes!: boolean;

  @ApiProperty()
  @IsBoolean()
  hasPets!: boolean;

  @ApiProperty({ enum: ['rarely', 'sometimes', 'often'] })
  @IsEnum(['rarely', 'sometimes', 'often'])
  guestsPref!: string;
}
