import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtStrategy } from '../common/guards/jwt/jwt.strategy';
// import { UserCourseProgress } from './entities/UserCourseProgress.entity';
import { UserDailyQuest } from './entities/UserDailyQuests.entity';
import { AiGenerationLog } from 'src/ai/entities/AiGenerationLog.entity';
import { DailyQuest } from './entities/dailyQuest.entity';
import { UserAvatar } from './entities/user-avatar.entity';
import { Avatar } from 'src/avatar/entities/avatar.entity';

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([User, AiGenerationLog, UserDailyQuest, DailyQuest, UserAvatar, Avatar])],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy],
  exports: [UsersService],
})
export class UsersModule {}