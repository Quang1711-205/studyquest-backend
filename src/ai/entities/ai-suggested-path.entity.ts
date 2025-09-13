import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('ai_suggested_paths')
export class AiSuggestedPath {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id' })
  userId: number; // ✅ Để query và tạo record dễ dàng

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // ✅ Chỉ định foreign key
  user: User; // ✅ Để load thông tin user khi cần

  @Column({ type: 'json', name: 'path_data' })
  pathData: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}