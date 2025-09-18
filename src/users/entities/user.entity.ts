// import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
// import { QuizAttempt } from 'src/learning/entities/quiz-attempt.entity';
// import { AiSuggestedPath } from 'src/ai/entities/ai-suggested-path.entity';
// import { AiGeneratedQuiz } from 'src/ai/entities/ai-generated-quiz.entity';
// import { AiGenerationLog } from 'src/ai/entities/AiGenerationLog.entity';
// import { Language } from 'src/language/entities/language.entity';
// import { ManyToOne, JoinColumn } from 'typeorm';

// @Entity('users')
// export class User {
//   @PrimaryGeneratedColumn('increment')
//   id: number;

//   @Column({ unique: true, length: 50 })
//   username: string;

//   @Column({ unique: true, length: 100 })
//   email: string;

//   @Column({ name: 'password_hash', length: 255 })
//   passwordHash: string;

//   @Column({ name: 'display_name', length: 100, nullable: true })
//   displayName?: string;

//   @Column({ name: 'avatar_url', length: 255, nullable: true })
//   avatarUrl?: string;

//   @Column({ default: 1 })
//   level: number;

//   @Column({ name: 'total_xp', default: 0 })
//   totalXp: number;

//   @Column({ name: 'current_streak', default: 0 })
//   currentStreak: number;

//   @Column({ name: 'max_streak', default: 0 })
//   maxStreak: number;

//   @Column({ name: 'total_gems', default: 0 })
//   totalGems: number;

//   @Column({ default: 5 })
//   hearts: number;

//   @Column({ 
//     type: 'enum', 
//     enum: ['admin', 'teacher', 'student'], 
//     default: 'student' 
//   })
//   role: 'admin' | 'teacher' | 'student';

//   @Column({ name: 'last_activity_date', type: 'date', nullable: true })
//   lastActivityDate?: Date;

//   @CreateDateColumn({ name: 'created_at' })
//   createdAt: Date;

//   @UpdateDateColumn({ name: 'updated_at' })
//   updatedAt: Date;

//   @Column({ name: 'default_language_id', type: 'int', nullable: true })
//   defaultLanguageId?: number;

//   @ManyToOne(() => Language, { nullable: true })
//   @JoinColumn({ name: 'default_language_id' }) // ✅ Đúng tên cột
//   defaultLanguage: Language;

//   @Column({ name: 'study_minutes_per_day', type: 'int', default: 15 })
//   studyMinutesPerDay: number;

//   @Column({ name: 'current_avatar_id', type: 'int', nullable: true })
//   currentAvatarId?: number;

//   // Relations
//   @OneToMany(() => QuizAttempt, quizAttempt => quizAttempt.user)
//   quizAttempts: QuizAttempt[];

//   @OneToMany(() => AiSuggestedPath, path => path.user)
//   aiPaths: AiSuggestedPath[];

//   @OneToMany(() => AiGeneratedQuiz, quiz => quiz.user)
//   aiQuizzes: AiGeneratedQuiz[];

//   @OneToMany(() => AiGenerationLog, log => log.user)
//   aiGenerationLogs: AiGenerationLog[];
// }
// src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { QuizAttempt } from 'src/learning/entities/quiz-attempt.entity';
import { AiSuggestedPath } from 'src/ai/entities/ai-suggested-path.entity';
import { AiGeneratedQuiz } from 'src/ai/entities/ai-generated-quiz.entity';
import { AiGenerationLog } from 'src/ai/entities/AiGenerationLog.entity';
import { Language } from 'src/language/entities/language.entity';
import { Avatar } from 'src/avatar/entities/avatar.entity';
import { UserAvatar } from './user-avatar.entity';

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

  @Column({ 
    type: 'enum', 
    enum: ['admin', 'teacher', 'student'], 
    default: 'student' 
  })
  role: 'admin' | 'teacher' | 'student';

  @Column({ name: 'last_activity_date', type: 'date', nullable: true })
  lastActivityDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'default_language_id', type: 'int', nullable: true })
  defaultLanguageId?: number;

  @ManyToOne(() => Language, { nullable: true })
  @JoinColumn({ name: 'default_language_id' })
  defaultLanguage: Language;

  @Column({ name: 'study_minutes_per_day', type: 'int', default: 15 })
  studyMinutesPerDay: number;

  // ✅ Giữ lại currentAvatarId để đơn giản hóa queries thường xuyên
  @Column({ name: 'current_avatar_id', type: 'int', nullable: true })
  currentAvatarId?: number;

  // ✅ Relationship tới avatar hiện tại (cho tiện lợi)
  @ManyToOne(() => Avatar, { nullable: true })
  @JoinColumn({ name: 'current_avatar_id' })
  currentAvatar?: Avatar;

  // Relations
  @OneToMany(() => QuizAttempt, quizAttempt => quizAttempt.user)
  quizAttempts: QuizAttempt[];

  @OneToMany(() => AiSuggestedPath, path => path.user)
  aiPaths: AiSuggestedPath[];

  @OneToMany(() => AiGeneratedQuiz, quiz => quiz.user)
  aiQuizzes: AiGeneratedQuiz[];

  @OneToMany(() => AiGenerationLog, log => log.user)
  aiGenerationLogs: AiGenerationLog[];

  // ✅ Relationship tới user_avatars (cho shop system)
  @OneToMany(() => UserAvatar, userAvatar => userAvatar.user)
  userAvatars: UserAvatar[];
}