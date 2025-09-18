import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Lesson } from '../../lessons/entities/lesson.entity';
import { CreateDateColumn } from 'typeorm';

export type QuestionType = 'multiple_choice' | 'translation' | 'audio' | 'matching';
export type QuizLevel = 'basic' | 'advanced';
export type QuizCategory = 'vocabulary' | 'grammar' | 'listening';



// @Entity('questions')
// export class Question {
//   @PrimaryGeneratedColumn('increment')
//   id: number;

//   @Column({ name: 'lesson_id' })
//   lessonId: number;

//   @Column({ name: 'question_type', type: 'enum', enum: ['multiple_choice', 'translation', 'audio', 'matching'] })
//   questionType: QuestionType;

//   @Column({ name: 'question_text', type: 'text' })
//   questionText: string;

//   @Column({ name: 'question_data', type: 'json', nullable: true })
//   questionData: any;

//   @Column({ name: 'correct_answer', type: 'json' })
//   correctAnswer: any;

//   @Column({ name: 'incorrect_answers', type: 'json', nullable: true })
//   incorrectAnswers: any;

//   @Column({ type: 'text', nullable: true })
//   explanation: string;

//   @Column({ type: 'int', default: 1 })
//   difficulty: number;

//   @Column({ name: 'sort_order', default: 0 })
//   sortOrder: number;

//   @Column({ name: 'is_active', default: true })
//   isActive: boolean;

//   @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   createdAt: Date;

//   // Thêm phân loại quiz
//   @Column({ name: 'quiz_level', type: 'enum', enum: ['basic', 'advanced'], default: 'basic' })
//   quizLevel: QuizLevel;

//   @Column({ name: 'quiz_category', type: 'enum', enum: ['vocabulary', 'grammar', 'listening'], default: 'vocabulary' })
//   quizCategory: QuizCategory;

//   @ManyToOne(() => Lesson)
//   @JoinColumn({ name: 'lesson_id' })
//   lesson: Lesson;
// }

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'lesson_id' })
  lessonId: number;

  @Column({ 
    name: 'question_type', 
    type: 'enum', 
    enum: ['multiple_choice', 'translation', 'audio', 'matching'] 
  })
  questionType: 'multiple_choice' | 'translation' | 'audio' | 'matching';

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ name: 'question_data', type: 'varchar', nullable: true })
  questionData: {
    audioUrl?: string;
    imageUrl?: string;
    transcript?: string;
    additionalInfo?: any;
  };

  @Column({ name: 'correct_answer', type: 'varchar' })
  correctAnswer: any;

  @Column({ name: 'incorrect_answers', type: 'varchar', nullable: true })
  incorrectAnswers: any;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'int', default: 1 })
  difficulty: number;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // ENHANCED: Quiz categorization for AI-generated questions
  @Column({ 
    name: 'quiz_level', 
    type: 'enum', 
    enum: ['basic', 'advanced'], 
    default: 'basic' 
  })
  quizLevel: 'basic' | 'advanced';

  @Column({ 
    name: 'quiz_category', 
    type: 'enum', 
    enum: ['vocabulary', 'grammar', 'listening'], 
    default: 'vocabulary' 
  })
  quizCategory: 'vocabulary' | 'grammar' | 'listening';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Lesson)
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;
}