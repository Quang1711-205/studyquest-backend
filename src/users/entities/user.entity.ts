import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { QuizAttempt } from 'src/learning/entities/quiz-attempt.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'display_name', length: 100, nullable: true })
  displayName?: string;

  @Column({ name: 'avatar_url', length: 255, nullable: true })
  avatarUrl?: string;

  @Column({ default: 1 })
  level: number;

  @Column({ name: 'total_xp', default: 0 })
  totalXp: number;

  @Column({ name: 'current_streak', default: 0 })
  currentStreak: number;

  @Column({ name: 'max_streak', default: 0 })
  maxStreak: number;

  @Column({ name: 'total_gems', default: 0 })
  totalGems: number;

  @Column({ default: 5 })
  hearts: number;

  @Column({ name: 'last_activity_date', type: 'date', nullable: true })
  lastActivityDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => QuizAttempt, quizAttempt => quizAttempt.user)
  quizAttempts: QuizAttempt[];
}