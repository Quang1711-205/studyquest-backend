import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserItems } from 'src/users/entities/UserItems.entity';
import { UserDailyQuest } from 'src/users/entities/UserDailyQuests.entity';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserItems)
    private readonly userItemsRepo: Repository<UserItems>,
    @InjectRepository(UserDailyQuest)
    private readonly userDailyQuestsRepo: Repository<UserDailyQuest>,
  ) {}

  async getStreak(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { currentStreak: user.currentStreak, maxStreak: user.maxStreak };
  }

  async getUserItems(userId: number) {
    return this.userItemsRepo.find({ where: { userId } });
  }

  async getUserDailyQuests(userId: number) {
    return this.userDailyQuestsRepo.find({ where: { userId } });
  }
}