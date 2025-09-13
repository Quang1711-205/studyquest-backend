import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('leaderboards')
export class Leaderboard {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'period_type', type: 'enum', enum: ['weekly', 'monthly', 'all_time'] })
  periodType: 'weekly' | 'monthly' | 'all_time';

  @Column({ name: 'period_start', type: 'date' })
  periodStart: string;

  @Column({ name: 'xp_earned', default: 0 })
  xpEarned: number;

  @Column({ name: 'lessons_completed', default: 0 })
  lessonsCompleted: number;

  @Column({ name: 'current_rank', nullable: true })
  currentRank: number;

  @Column({ name: 'calculated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  calculatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}