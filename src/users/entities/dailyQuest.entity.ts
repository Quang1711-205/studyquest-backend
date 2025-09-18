import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserDailyQuest } from './UserDailyQuests.entity';

@Entity('daily_quests')
export class DailyQuest {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'quest_date', type: 'date' })
  questDate: Date;

  @Column({ 
    name: 'quest_type',
    type: 'enum', 
    enum: ['xp_earn', 'lessons_complete', 'streak_maintain', 'accuracy_achieve', 'quiz_complete', 'category_focus', 'language_focus']
  })
  questType: 'xp_earn' | 'lessons_complete' | 'streak_maintain' | 'accuracy_achieve' | 'quiz_complete' | 'category_focus' | 'language_focus';

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    name: 'requirement_value',
    type: 'bigint',
    nullable: false,
    default: 0
  })
  requirementValue: number;

  // NEW: For AI-generated category-specific quests
  @Column({ name: 'quest_data', type: 'json', nullable: true })
  questData: {
    category?: 'grammar' | 'listening' | 'vocabulary';
    level?: 'basic' | 'advanced';
    lessonIds?: number[];
    specificRequirements?: any;
  };

  @Column({ name: 'xp_reward', default: 50 })
  xpReward: number;

  @Column({ name: 'gem_reward', default: 5 })
  gemReward: number;

  // NEW: Track if quest was AI-generated
  @Column({ name: 'is_ai_generated', default: false })
  isAiGenerated: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => UserDailyQuest, userQuest => userQuest.dailyQuest)
  userQuests: UserDailyQuest[];
}