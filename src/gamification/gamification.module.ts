import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UserItems } from 'src/users/entities/UserItems.entity';
import { UserDailyQuest } from 'src/users/entities/UserDailyQuests.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserItems, UserDailyQuest])],
  controllers: [GamificationController],
  providers: [GamificationService],
})
export class GamificationModule {}
