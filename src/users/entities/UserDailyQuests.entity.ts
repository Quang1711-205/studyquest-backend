import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DailyQuest } from './dailyQuest.entity';
import { CreateDateColumn } from 'typeorm';

// @Entity('user_daily_quests')
// export class UserDailyQuests {
//   @PrimaryGeneratedColumn('increment')
//   id: number;

//   @Column({ name: 'user_id' })
//   userId: number;

//   @Column({ name: 'daily_quest_id' })
//   dailyQuestId: number;

//   @Column({ name: 'progress_value', default: 0 })
//   progressValue: number;

//   @Column({ name: 'is_completed', default: false })
//   isCompleted: boolean;

//   @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
//   completedAt: Date;

//   @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   createdAt: Date;

//   @ManyToOne(() => User)
//   @JoinColumn({ name: 'user_id' })
//   user: User;
// }

@Entity('user_daily_quests')
export class UserDailyQuest {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'daily_quest_id' })
  dailyQuestId: number;

  @Column({ name: 'progress_value', default: 0 })
  progressValue: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => DailyQuest)
  @JoinColumn({ name: 'daily_quest_id' })
  dailyQuest: DailyQuest;
}