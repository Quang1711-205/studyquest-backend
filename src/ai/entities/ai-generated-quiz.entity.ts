import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('ai_generated_quizzes')
export class AiGeneratedQuiz {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id' })
  userId: number; // ✅ Để query và tạo record dễ dàng

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // ✅ Chỉ định foreign key
  user: User; // ✅ Để load thông tin user khi cần

  @Column({ type: 'json', name: 'quiz_data' })
  quizData: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}