import { IsEnum, IsNotEmpty, IsOptional, Max, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetQuestionsDto {
  @IsNotEmpty()
  @Type(() => Number)
  courseId: number;

  @IsOptional()
  @Type(() => Number)
  languageId?: number;

  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsEnum(['multiple_choice', 'translation', 'audio', 'matching'])
  questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching';

  @IsOptional()
  @IsEnum(['vocabulary', 'grammar', 'listening'])
  quizCategory?: 'vocabulary' | 'grammar' | 'listening';

  @IsOptional()
  @IsEnum(['basic', 'advanced'])
  quizLevel?: 'basic' | 'advanced';

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(10)
  difficulty?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100) // Thêm max limit để tránh performance issues
  limit: number = 10;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  onlyActive: boolean = true;
}

export class QuestionResponseDto {
  id: number;
  lessonId: number;
  questionType: string;
  questionText: string;
  questionData?: any;
  correctAnswer: any;
  incorrectAnswers?: any;
  explanation?: string;
  difficulty: number;
  quizLevel: string;
  quizCategory: string;
  lesson?: {
    id: number;
    title: string;
    lessonType: string;
    courseId: number;
  };
}