import { ArrayMaxSize, ArrayMinSize, IsArray, IsISO8601 } from 'class-validator';

export class ProposeCallDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsISO8601({}, { each: true })
  proposedTimes!: string[];
}
