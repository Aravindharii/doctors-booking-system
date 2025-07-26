import { IsDateString } from 'class-validator';

export class CreateSlotDto {
  @IsDateString()
  start: string;

  @IsDateString()
  end: string;
}
