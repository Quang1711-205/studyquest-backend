import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserAvatar } from 'src/users/entities/user-avatar.entity';

@Entity('avatars')
export class Avatar {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 10 })
  emoji: string;

  @Column({ length: 7 })
  color: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ default: 0 })
  price: number;

  @Column({ 
    type: 'enum', 
    enum: ['common', 'rare', 'epic', 'legendary'], 
    default: 'common' 
  })
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  @Column({ name: 'unlock_level', default: 1 })
  unlockLevel: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserAvatar, userAvatar => userAvatar.avatar)
  userAvatars: UserAvatar[];
}