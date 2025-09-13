import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Lesson } from 'src/lessons/entities/lesson.entity';

@Entity('user_lesson_progress')
export class UserLessonProgress {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', name: 'lesson_id' })
  lessonId: number;

  @Column({ type: 'enum', enum: ['locked', 'available', 'started', 'completed', 'mastered'], default: 'locked' })
  status: string;

  @Column({ type: 'int', default: 0, name: 'best_score' })
  bestScore: number;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 0, name: 'total_time_seconds' })
  totalTimeSeconds: number;

  @Column({ type: 'int', default: 0 })
  xpEarned: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_attempt_at' })
  lastAttemptAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Lesson)
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;
}