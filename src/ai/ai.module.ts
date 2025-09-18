import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiGeneratedQuiz } from './entities/ai-generated-quiz.entity';
import { AiSuggestedPath } from './entities/ai-suggested-path.entity';
import { User } from '../users/entities/user.entity';
import { DailyQuest } from '../users/entities/dailyQuest.entity';
import { UserDailyQuest } from 'src/users/entities/UserDailyQuests.entity';
import { Lesson } from 'src/lessons/entities/lesson.entity';
import { Question } from 'src/question/entities/question.entity';
import { Course } from 'src/courses/entities/course.entity';
import { Language } from 'src/language/entities/language.entity';
import { QuizAttempt } from 'src/learning/entities/quiz-attempt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiGeneratedQuiz, AiSuggestedPath, User, DailyQuest, UserDailyQuest, Lesson, Question, Course, Language, QuizAttempt])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService]
})
export class AiModule {}