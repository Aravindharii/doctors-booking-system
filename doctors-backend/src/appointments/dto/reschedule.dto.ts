import { IsInt } from 'class-validator';

export class RescheduleDto {
  @IsInt()
  newSlotId: number;
}
