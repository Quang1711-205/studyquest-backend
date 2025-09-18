import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('ai_generation_logs')
export class AiGenerationLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ 
    name: 'operation_type',
    type: 'enum', 
    enum: ['generate_path', 'generate_lesson', 'generate_questions', 'generate_quiz'] 
  })
  operationType: 'generate_path' | 'generate_lesson' | 'generate_questions' | 'generate_quiz';

  @Column({ 
    name: 'entity_type',
    type: 'enum', 
    enum: ['path', 'lesson', 'question', 'quiz'] 
  })
  entityType: 'path' | 'lesson' | 'question' | 'quiz';

  @Column({ name: 'entity_id', nullable: true })
  entityId?: number;

  @Column({ name: 'request_data', type: 'json' })
  requestData: any;

  @Column({ name: 'response_data', type: 'json' })
  responseData: any;

  @Column({ name: 'generation_time_ms' })
  generationTimeMs: number;

  @Column({ default: true })
  success: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}