import { IsOptional, IsDateString } from 'class-validator';

export class GetUserDailyQuestsDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}