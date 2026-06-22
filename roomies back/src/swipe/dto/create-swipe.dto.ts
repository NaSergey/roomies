import { IsEnum, IsInt, IsPositive } from 'class-validator';

export enum SwipeActionDto {
  like = 'like',
  pass = 'pass',
  super_like = 'super_like',
  save = 'save',
}

export class CreateSwipeDto {
  @IsInt()
  @IsPositive()
  targetId: number;

  @IsEnum(SwipeActionDto)
  action: SwipeActionDto;
}
