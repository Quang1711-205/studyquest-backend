import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
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

  @Column({ name: 'time_taken_seconds', default: 0 })
  timeTakenSeconds: number;

  @Column({ name: 'xp_earned', default: 0 })
  xpEarned: number;

  @Column({ name: 'hearts_used', default: 0 })
  heartsUsed: number;

  @Column({ name: 'attempt_data', type: 'json' })
  attemptData: any;

  @Column({ name: 'started_at', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ name: 'completed_at', default: () => 'CURRENT_TIMESTAMP' })
  completedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Lesson)
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;
}