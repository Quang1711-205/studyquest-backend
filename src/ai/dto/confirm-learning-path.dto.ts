import { IsNotEmpty, IsNumber, IsObject } from 'class-validator';

interface LearningStep {
  title: string;
  description: string;
  lessonType: 'vocabulary' | 'grammar' | 'listening' | 'mixed';
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  topics: string[];
}

interface ProcessedPathData {
  title: string;
  description: string;
  estimatedDuration: string;
  targetLevel: 'beginner' | 'intermediate' | 'advanced';
  steps: LearningStep[];
  totalSteps: number;
  preferences: string[];
}

export class ConfirmLearningPathDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  courseId: number;

  @IsNotEmpty()
  @IsObject()
  pathData: ProcessedPathData;
}