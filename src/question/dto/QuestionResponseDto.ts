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