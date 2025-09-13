import { IsNotEmpty, IsArray, IsNumber, IsPositive, ArrayMinSize } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SuggestLearningPathDto {
  @IsNumber({}, { message: 'userId must be a number' })
  @IsPositive({ message: 'userId must be a positive number' })
  @Type(() => Number)
  userId: number;

  @IsArray({ message: 'preferences must be an array' })
  @ArrayMinSize(1, { message: 'preferences must contain at least one item' })
  @IsNotEmpty({ each: true, message: 'each preference cannot be empty' })
  @Transform(({ value }) => 
    Array.isArray(value) ? value.map(item => item?.toString().trim()).filter(Boolean) : value
  )
  preferences: string[];
}
