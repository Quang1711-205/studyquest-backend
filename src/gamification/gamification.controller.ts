import { Controller, Get, Param } from '@nestjs/common';
import { GamificationService } from './gamification.service';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('streak/:userId')
  getStreak(@Param('userId') userId: number) {
    return this.gamificationService.getStreak(userId);
  }

  @Get('items/:userId')
  getUserItems(@Param('userId') userId: number) {
    return this.gamificationService.getUserItems(userId);
  }

  @Get('daily-quests/:userId')
  getUserDailyQuests(@Param('userId') userId: number) {
    return this.gamificationService.getUserDailyQuests(userId);
  }
}