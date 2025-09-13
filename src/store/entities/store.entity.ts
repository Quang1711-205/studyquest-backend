import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

export type ItemType = 'powerup' | 'cosmetic' | 'boost' | 'heart_refill';

@Entity('store_items')
@Index('idx_type_available', ['itemType', 'isAvailable'])
@Index('idx_cost', ['gemCost'])
export class StoreItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ['powerup', 'cosmetic', 'boost', 'heart_refill'] })
  itemType: ItemType;

  @Column({ type: 'json', nullable: true, name: 'item_data' })
  itemData: Record<string, any> | null; // có thể chứa duration, boost %, v.v.

  @Column({ name: 'gem_cost' })
  gemCost: number;

  @Column({ nullable: true })
  icon: string;

  @Column({ name: 'is_available', default: true})
  isAvailable: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
