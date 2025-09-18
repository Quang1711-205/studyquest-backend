import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Lesson } from 'src/lessons/entities/lesson.entity';

@Entity('user_lesson_progress')
export class UserLessonProgress {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'lesson_id' })
  lessonId: number;

  @Column({ 
    type: 'enum', 
    enum: ['locked', 'available', 'started', 'completed', 'mastered'], 
    default: 'locked' 
  })
  status: 'locked' | 'available' | 'started' | 'completed' | 'mastered';

  @Column({ name: 'best_score', default: 0 })
  bestScore: number;

  @Column({ default: 0 })
  attempts: number;

  @Column({ name: 'total_time_seconds', default: 0 })
  totalTimeSeconds: number;

  @Column({ name: 'xp_earned', default: 0 })
  xpEarned: number;

  @Column({ name: 'last_attempt_at', nullable: true })
  lastAttemptAt?: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Lesson)
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;
}