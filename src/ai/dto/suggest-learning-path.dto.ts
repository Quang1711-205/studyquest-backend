import { IsNotEmpty, IsArray, IsNumber, IsPositive, ArrayMinSize } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsString, IsOptional } from 'class-validator';

export class SuggestLearningPathDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  preferences: string[];

  @IsOptional()
  @IsString()
  targetCourse?: string;

  @IsOptional()
  @IsString()
  targetLanguage?: string;
}
