import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { UserLessonProgress } from '../../users/entities/UserLessonProgress.entity';
import { QuizAttempt } from '../../learning/entities/quiz-attempt.entity';
import { CreateDateColumn } from 'typeorm';
import { AiSuggestedPath } from 'src/ai/entities/ai-suggested-path.entity';
import { Question } from '../../question/entities/question.entity';
// import { Question } from '../../entities/question.entity'; // hoặc đúng đường dẫn tới question.entity.ts

// @Entity('lessons')
// export class Lesson {
//   @PrimaryGeneratedColumn('increment')
//   id: number;

//   @Column({ type: 'bigint', name: 'course_id' })
//   courseId: number;

//   @Column({ type: 'varchar', length: 100 })
//   title: string;

//   @Column({ type: 'text', nullable: true })
//   description: string;

//   @Column({ type: 'enum', enum: ['vocabulary', 'grammar', 'listening', 'speaking', 'mixed'], name: 'lesson_type' })
//   lessonType: 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'mixed';

//   @Column({ type: 'json', nullable: true })
//   content: any;

//   @Column({ type: 'int', default: 15, name: 'xp_reward' })
//   xpReward: number;

//   @Column({ type: 'json', nullable: true, name: 'unlock_requirement' })
//   unlockRequirement: any;

//   @Column({ type: 'boolean', default: true, name: 'is_active' })
//   isActive: boolean;

//   @Column({ type: 'int', default: 0, name: 'sort_order' })
//   sortOrder: number;

//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
//   createdAt: Date;

//   // Mối quan hệ Many-to-One với Course
//   @ManyToOne(() => Course)
//   @JoinColumn({ name: 'course_id' })
//   course: Course;

//   // Mối quan hệ One-to-Many với Question
//   // @OneToMany(() => Question, question => question.lesson)
//   // questions: Question[];

//   // Mối quan hệ One-to-Many với UserLessonProgress
//   @OneToMany(() => UserLessonProgress, userProgress => userProgress.lesson)
//   userProgresses: UserLessonProgress[];

//   // Mối quan hệ One-to-Many với QuizAttempt (nếu cần)
//   @OneToMany(() => QuizAttempt, quizAttempt => quizAttempt.lesson)
//   quizAttempts: QuizAttempt[];
// }

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'course_id' })
  courseId: number;

  // NEW: Track which AI path generated this lesson
  @Column({ type: 'bigint', name: 'ai_path_id', nullable: true })
  aiPathId?: number;

  // NEW: Track creation source
  @Column({ 
    type: 'enum', 
    enum: ['manual', 'ai_generated'], 
    default: 'manual',
    name: 'creation_source' 
  })
  creationSource: 'manual' | 'ai_generated';

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    type: 'enum', 
    enum: ['vocabulary', 'grammar', 'listening', 'speaking', 'mixed'], 
    name: 'lesson_type' 
  })
  lessonType: 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'mixed';

  @Column({ type: 'json', nullable: true })
  content: {
    theory?: string;
    examples?: string[];
    vocabulary?: Array<{word: string; meaning: string; example: string}>;
    keyPoints?: string[];
    exercises?: string[];
  };

  @Column({ type: 'int', default: 15, name: 'xp_reward' })
  xpReward: number;

  @Column({ type: 'json', nullable: true, name: 'unlock_requirement' })
  unlockRequirement: {
    previousLessonId?: number;
    minXp?: number;
    completedLessons?: number[];
  };

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  // NEW: Relation with AI path that generated this lesson
  @ManyToOne(() => AiSuggestedPath, { nullable: true })
  @JoinColumn({ name: 'ai_path_id' })
  aiPath?: AiSuggestedPath;

  @OneToMany(() => Question, question => question.lesson)
  questions: Question[];

  @OneToMany(() => UserLessonProgress, userProgress => userProgress.lesson)
  userProgresses: UserLessonProgress[];

  @OneToMany(() => QuizAttempt, quizAttempt => quizAttempt.lesson)
  quizAttempts: QuizAttempt[];
}