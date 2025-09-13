import { Module } from '@nestjs/common';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { UserLessonProgress } from '../users/entities/UserLessonProgress.entity';
import { UserStats } from '../users/entities/UserStats.entity';
import { Lesson } from 'src/lessons/entities/lesson.entity';
import { UserCourseProgress } from 'src/users/entities/UserCourseProgress.entity';


@Module({
  imports: [TypeOrmModule.forFeature([User, QuizAttempt, UserStats, Lesson, UserLessonProgress, UserCourseProgress])],
  controllers: [LearningController],
  providers: [LearningService],
})
export class LearningModule {}