import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_stats')
export class UserStats {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'date', name: 'stat_date' })
  statDate: string;

  @Column({ type: 'int', default: 0, name: 'xp_earned' })
  xpEarned: number;

  @Column({ type: 'int', default: 0, name: 'lessons_completed' })
  lessonsCompleted: number;

  @Column({ type: 'int', default: 0, name: 'quizzes_completed' })
  quizzesCompleted: number;

  @Column({ type: 'int', default: 0, name: 'correct_answers' })
  correctAnswers: number;

  @Column({ type: 'int', default: 0, name: 'total_answers' })
  totalAnswers: number;

  @Column({ type: 'int', default: 0, name: 'study_time_minutes' })
  studyTimeMinutes: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' , name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}