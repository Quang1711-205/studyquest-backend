import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { LessonsModule } from './lessons/lessons.module';
import { GamificationModule } from './gamification/gamification.module';
import { StoreModule } from './store/store.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LearningModule } from './learning/learning.module';
import { AiModule } from './ai/ai.module';
import { LanguageModule } from './language/language.module';
import { QuestionModule } from './question/question.module';
import { AvatarModule } from './avatar/avatar.module';
import { LeaderboardModule } from './leaderboards/leaderboards.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT as string, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: false, // Chỉ nên dùng true khi phát triển
    }),
    UsersModule,
    AuthModule,
    CoursesModule,
    LessonsModule,
    GamificationModule,
    StoreModule,
    LearningModule,
    AiModule,
    LanguageModule,
    QuestionModule,
    AvatarModule,
    LeaderboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}