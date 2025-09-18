import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Avatar } from 'src/avatar/entities/avatar.entity';

@Entity('user_avatars')
@Unique(['userId', 'avatarId'])
export class UserAvatar {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'avatar_id' })
  avatarId: number;

  @Column({ name: 'is_equipped', default: false })
  isEquipped: boolean;

  @CreateDateColumn({ name: 'purchased_at' })
  purchasedAt: Date;

  @ManyToOne(() => User, user => user.userAvatars, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Avatar, avatar => avatar.userAvatars, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'avatar_id' })
  avatar: Avatar;
}