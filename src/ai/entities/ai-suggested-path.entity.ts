import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Course } from 'src/courses/entities/course.entity';
import { OneToMany } from 'typeorm/decorator/relations/OneToMany';
import { Lesson } from 'src/lessons/entities/lesson.entity';

// @Entity('ai_suggested_paths')
// export class AiSuggestedPath {
//   @PrimaryGeneratedColumn('increment')
//   id: number;

//   @Column({ name: 'user_id' })
//   userId: number; // ✅ Để query và tạo record dễ dàng

//   @ManyToOne(() => User, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'user_id' }) // ✅ Chỉ định foreign key
//   user: User; // ✅ Để load thông tin user khi cần

//   @Column({ type: 'json', name: 'path_data' })
//   pathData: any;

//   @CreateDateColumn({ name: 'created_at' })
//   createdAt: Date;
// }

@Entity('ai_suggested_paths')
export class AiSuggestedPath {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'json', name: 'path_data' })
  pathData: any;

  // NEW: Track workflow status
  @Column({ 
    type: 'enum', 
    enum: ['draft', 'confirmed', 'completed'], 
    default: 'draft',
    name: 'status' 
  })
  status: 'draft' | 'confirmed' | 'completed';

  // NEW: Link to specific course
  @Column({ name: 'course_id', nullable: true })
  courseId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Course, { nullable: true })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  // NEW: One-to-Many with lessons generated from this path
  @OneToMany(() => Lesson, lesson => lesson.aiPath)
  generatedLessons: Lesson[];
}