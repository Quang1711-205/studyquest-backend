export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface QuizResponseDto {
  success: boolean;
  message: string;
  data: {
    quizId: number;
    userId: number;
    username: string;
    questions: QuizQuestion[];
    questionCount: number;
    createdAt: Date;
  };
}