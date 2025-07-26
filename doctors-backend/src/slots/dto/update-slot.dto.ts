import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateSlotDto {
  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;

  @IsOptional()
  @IsBoolean()
  isBooked?: boolean;
}
