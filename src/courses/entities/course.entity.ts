import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Language } from '../../language/entities/language.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', name: "language_id"})
  languageId: number;

  @Column({ type: 'varchar', length: 100, name: "title" })
  title: string;

  @Column({ type: 'text', nullable: true, name: "description" })
  description: string;

  @Column({ type: 'enum', enum: ['beginner', 'intermediate', 'advanced'], name: "difficulty_level" })
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';

  @Column({ type: 'varchar', length: 255, nullable: true, name: "icon" })
  icon: string;

  @Column({ type: 'varchar', length: 7, nullable: true, name: "color_theme" })
  colorTheme: string;

  @Column({ type: 'int', default: 0, name: "unlock_requirement_xp" })
  unlockRequirementXp: number;

  @Column({ type: 'boolean', default: true, name: "is_active" })
  isActive: boolean;

  @Column({ type: 'int', default: 0, name: "sort_order" })
  sortOrder: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: "created_at"  })
  createdAt: Date;

  @ManyToOne(() => Language)
  @JoinColumn({ name: 'languageId' })
  language: Language;
}