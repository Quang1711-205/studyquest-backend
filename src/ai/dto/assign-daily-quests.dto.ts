import { IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class AssignDailyQuestsDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}