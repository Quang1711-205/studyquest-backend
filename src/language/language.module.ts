import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';
import { Language } from './entities/language.entity';
import { UserCourseProgress } from 'src/users/entities/UserCourseProgress.entity';
import { Course } from '../courses/entities/course.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { AiService } from '../ai/ai.service';
import { AiSuggestedPath } from 'src/ai/entities/ai-suggested-path.entity';
import { AiGeneratedQuiz } from 'src/ai/entities/ai-generated-quiz.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Language, UserCourseProgress, Course, Lesson, AiSuggestedPath, AiGeneratedQuiz, User])],
  controllers: [LanguageController],
  providers: [LanguageService, AiService],
  exports: [LanguageService],
})
export class LanguageModule {}