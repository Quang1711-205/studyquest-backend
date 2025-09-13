export type QuestionType = 'multiple_choice' | 'translation' | 'audio' | 'matching';
export type QuizLevel = 'basic' | 'advanced';
export type QuizCategory = 'vocabulary' | 'grammar' | 'listening';

export class CreateQuestionDto {
  lessonId: number;
  questionType: QuestionType;
  questionText: string;
  questionData?: any;
  correctAnswer: any;
  incorrectAnswers?: any;
  explanation?: string;
  difficulty?: number;
  sortOrder?: number;
  isActive?: boolean;
  quizLevel: QuizLevel;
  quizCategory: QuizCategory;

}