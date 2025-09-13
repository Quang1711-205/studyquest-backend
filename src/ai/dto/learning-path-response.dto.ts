export interface LearningStep {
  title: string;
  description: string;
  estimatedTime?: string;
  resources?: string[];
}

export interface LearningPathResponseDto {
  success: boolean;
  message: string;
  data: {
    pathId: number;
    userId: number;
    username: string;
    title: string;
    description: string;
    steps: LearningStep[];
    totalSteps: number;
    estimatedDuration?: string;
    preferences: string[];
    createdAt: Date;
  };
}