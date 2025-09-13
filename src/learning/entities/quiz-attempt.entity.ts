import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Lesson } from 'src/lessons/entities/lesson.entity';

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'lesson_id' })
  lessonId: number;

  @Column()
  score: number;

  @Column({ name: 'max_score' })
  maxScore: number;

  @Column({ name: 'accuracy_percentage', type: 'decimal', precision: 5, scale: 2 })
  accuracyPercentage: number;

  @Column({ name: 'time_taken_seconds' })
  timeTakenSeconds: number;

  @Column({ name: 'xp_earned' })
  xpEarned: number;

  @Column({ name: 'hearts_used' })
  heartsUsed: number;

  @Column({ name: 'attempt_data', type: 'json', nullable: true })
  attemptData: any;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp' })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Mối quan hệ Many-to-One với User
  @ManyToOne(() => User, user => user.quizAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Mối quan hệ Many-to-One với Lesson
  @ManyToOne(() => Lesson, lesson => lesson.quizAttempts)
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;
}