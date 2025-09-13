import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { UserLessonProgress } from '../../users/entities/UserLessonProgress.entity';
import { QuizAttempt } from '../../learning/entities/quiz-attempt.entity';
// import { Question } from '../../entities/question.entity'; // hoặc đúng đường dẫn tới question.entity.ts

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'course_id' })
  courseId: number;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['vocabulary', 'grammar', 'listening', 'speaking', 'mixed'], name: 'lesson_type' })
  lessonType: 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'mixed';

  @Column({ type: 'json', nullable: true })
  content: any;

  @Column({ type: 'int', default: 15, name: 'xp_reward' })
  xpReward: number;

  @Column({ type: 'json', nullable: true, name: 'unlock_requirement' })
  unlockRequirement: any;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  // Mối quan hệ Many-to-One với Course
  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  // Mối quan hệ One-to-Many với Question
  // @OneToMany(() => Question, question => question.lesson)
  // questions: Question[];

  // Mối quan hệ One-to-Many với UserLessonProgress
  @OneToMany(() => UserLessonProgress, userProgress => userProgress.lesson)
  userProgresses: UserLessonProgress[];

  // Mối quan hệ One-to-Many với QuizAttempt (nếu cần)
  @OneToMany(() => QuizAttempt, quizAttempt => quizAttempt.lesson)
  quizAttempts: QuizAttempt[];
}