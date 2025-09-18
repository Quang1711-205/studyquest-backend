// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Leaderboard } from './entities/Leaderboard.entity';
// import { User } from '../users/entities/user.entity';

// @Injectable()
// export class LeaderboardService {
//   constructor(
//     @InjectRepository(Leaderboard)
//     private readonly leaderboardRepo: Repository<Leaderboard>,
//     @InjectRepository(User)
//     private readonly userRepo: Repository<User>,
//   ) {}

//   async getTop(periodType: 'weekly' | 'monthly', limit = 10) {
//     // Lấy ngày bắt đầu tuần/tháng hiện tại
//     const now = new Date();
//     let periodStart: string;
//     if (periodType === 'weekly') {
//       const day = now.getDay() || 7;
//       now.setHours(0, 0, 0, 0);
//       now.setDate(now.getDate() - day + 1);
//       periodStart = now.toISOString().slice(0, 10);
//     } else {
//       periodStart = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
//     }
//     // Lấy top user theo XP
//     return this.leaderboardRepo.find({
//       where: { periodType, periodStart },
//       order: { xpEarned: 'DESC' },
//       take: limit,
//       relations: ['user'],
//     });
//   }
// }

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getTopUsers(limit = 10) {
    // Lấy top users theo totalXp, kèm avatar và rank
    const users = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.currentAvatar', 'avatar')
      .orderBy('user.totalXp', 'DESC')
      .limit(limit)
      .getMany();

    // Thêm rank cho từng user
    return users.map((user, index) => ({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatar: user.currentAvatar ? {
        id: user.currentAvatar.id,
        name: user.currentAvatar.name,
        emoji: user.currentAvatar.emoji,
        color: user.currentAvatar.color,
        rarity: user.currentAvatar.rarity,
      } : null,
      totalXp: user.totalXp,
      level: user.level,
      rank: index + 1, // Rank bắt đầu từ 1
    }));
  }

  async getUserRank(userId: number) {
    // Đếm số user có XP cao hơn user hiện tại
    const higherRankCount = await this.userRepo
      .createQueryBuilder('user')
      .where('user.totalXp > (SELECT u2.totalXp FROM users u2 WHERE u2.id = :userId)', { userId })
      .getCount();

    // Lấy thông tin user hiện tại
    const currentUser = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.currentAvatar', 'avatar')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!currentUser) {
      throw new Error('User not found');
    }

    return {
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      avatar: currentUser.currentAvatar ? {
        id: currentUser.currentAvatar.id,
        name: currentUser.currentAvatar.name,
        emoji: currentUser.currentAvatar.emoji,
        color: currentUser.currentAvatar.color,
        rarity: currentUser.currentAvatar.rarity,
      } : null,
      totalXp: currentUser.totalXp,
      level: currentUser.level,
      rank: higherRankCount + 1,
    };
  }
}