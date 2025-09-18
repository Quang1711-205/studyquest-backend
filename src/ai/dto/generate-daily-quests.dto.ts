import { IsOptional, IsDateString } from 'class-validator';

export class GenerateDailyQuestsDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}