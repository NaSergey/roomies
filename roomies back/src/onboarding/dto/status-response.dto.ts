import { ApiProperty } from '@nestjs/swagger';

export class OnboardingStatusDto {
  @ApiProperty()
  onboardingStep!: number;

  @ApiProperty()
  onboardingCompleted!: boolean;

  @ApiProperty()
  quizCompleted!: boolean;

  @ApiProperty({ nullable: true })
  scenario!: string | null;

  @ApiProperty({ nullable: true })
  cityId!: number | null;

  @ApiProperty({ type: [Number] })
  districtIds!: number[];

  @ApiProperty({ nullable: true })
  budgetMin!: number | null;

  @ApiProperty({ nullable: true })
  budgetMax!: number | null;

  @ApiProperty({ nullable: true })
  moveInDate!: string | null;

  @ApiProperty({ nullable: true })
  stayDurationMonths!: number | null;

  @ApiProperty()
  smokingOk!: boolean;

  @ApiProperty()
  petsOk!: boolean;

  @ApiProperty()
  smokes!: boolean;

  @ApiProperty()
  hasPets!: boolean;

  @ApiProperty()
  guestsPref!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  telegramPhotoUrl!: string | null;

  @ApiProperty({ type: [Number] })
  vibeTagIds!: number[];
}
