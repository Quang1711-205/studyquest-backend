import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './entities/lesson.entity';
import { Course } from 'src/courses/entities/course.entity';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { UserLessonProgress } from 'src/users/entities/UserLessonProgress.entity';

@Module({
    imports: [
    TypeOrmModule.forFeature([Lesson, Course, UserLessonProgress]),
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
