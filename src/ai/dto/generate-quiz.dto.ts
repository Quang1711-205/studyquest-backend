import { IsNotEmpty, IsString, IsNumber, IsPositive, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GenerateQuizDto {
  @IsNumber({}, { message: 'userId must be a number' })
  @IsPositive({ message: 'userId must be a positive number' })
  @Type(() => Number)
  userId: number;

  @IsString({ message: 'text must be a string' })
  @IsNotEmpty({ message: 'text cannot be empty' })
  @MinLength(10, { message: 'text must be at least 10 characters long' })
  @Transform(({ value }) => value?.trim())
  text: string;
}