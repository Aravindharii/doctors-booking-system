import { IsInt } from 'class-validator';

export class BookAppointmentDto {
  @IsInt()
  doctorId: number;

  @IsInt()
  slotId: number;
}
