import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leaderboard } from './entities/Leaderboard.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Leaderboard)
    private readonly leaderboardRepo: Repository<Leaderboard>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getTop(periodType: 'weekly' | 'monthly', limit = 10) {
    // Lấy ngày bắt đầu tuần/tháng hiện tại
    const now = new Date();
    let periodStart: string;
    if (periodType === 'weekly') {
      const day = now.getDay() || 7;
      now.setHours(0, 0, 0, 0);
      now.setDate(now.getDate() - day + 1);
      periodStart = now.toISOString().slice(0, 10);
    } else {
      periodStart = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
    }
    // Lấy top user theo XP
    return this.leaderboardRepo.find({
      where: { periodType, periodStart },
      order: { xpEarned: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }
}