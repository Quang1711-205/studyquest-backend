import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    // Ẩn passwordHash khi trả về
    const { passwordHash, ...result } = user;
    return result;
  }

  async updateAvatar(userId: number, avatarUrl: string) {
    await this.usersRepository.update(userId, { avatarUrl });
    return { message: 'Avatar updated' };
  }

  async updateStats(
    userId: number,
    stats: { xp?: number; streak?: number; gems?: number },
  ) {
    await this.usersRepository.update(userId, {
      ...(stats.xp !== undefined && { totalXp: stats.xp }),
      ...(stats.streak !== undefined && { currentStreak: stats.streak }),
      ...(stats.gems !== undefined && { totalGems: stats.gems }),
    });
    return { message: 'Stats updated' };
  }

  private normalizeDate(d: Date): string {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  async getStreakStatus(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    // Lấy ngày hôm nay (UTC)
    const todayUTC = new Date();
    const today = new Date(todayUTC.getFullYear(), todayUTC.getMonth(), todayUTC.getDate());

    const lastActivity = user.lastActivityDate
      ? new Date(user.lastActivityDate.getFullYear(), user.lastActivityDate.getMonth(), user.lastActivityDate.getDate())
      : null;

    let learnedToday = false;
    if (lastActivity) {
      learnedToday = (today.getTime() - lastActivity.getTime()) === 0;
    }

    return {
      currentStreak: user.currentStreak,
      maxStreak: user.maxStreak,
      lastActivityDate: user.lastActivityDate,
      learnedToday,
      totalGems: user.totalGems,
    };
  }


  async updateStreakHybrid(userId: number, today: Date) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    const todayUTC = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastActivityUTC = user.lastActivityDate 
      ? new Date(user.lastActivityDate.getFullYear(), user.lastActivityDate.getMonth(), user.lastActivityDate.getDate())
      : null;

    let daysDiff = 0;
    if (lastActivityUTC) {
      daysDiff = Math.floor((todayUTC.getTime() - lastActivityUTC.getTime()) / (1000 * 3600 * 24));
    }

    if (daysDiff === 0) {
      return { currentStreak: user.currentStreak, learnedToday: true };
    }

    const MAX_BREAK_DAYS = 7;
    
    if (daysDiff !== null && daysDiff > MAX_BREAK_DAYS) {
      user.currentStreak = 1;
    } else {
      user.currentStreak += 1;
    }

    user.lastActivityDate = todayUTC;
    user.maxStreak = Math.max(user.maxStreak, user.currentStreak);

    // COMBO: Mốc đặc biệt + bội số thường xuyên
    let totalReward = 0;
    const rewards: Array<{ type: string; amount: number; reason: string }> = [];

    // Mốc đặc biệt (thưởng lớn)
    const specialMilestones: Record<number, number> = {
      3: 15,    // Bonus lần đầu
      10: 30,   // Tuần đầu hoàn thành
      50: 100,  // Thành tích lớn
      365: 1000 // Streak cả năm!
    };

    if (specialMilestones[user.currentStreak]) {
      const specialReward = specialMilestones[user.currentStreak];
      totalReward += specialReward;
      rewards.push({
        type: 'special milestone',
        amount: specialReward,
        reason: `${user.currentStreak} days achievement!`
      });
    }

    // Bội số thường xuyên (thưởng nhỏ nhưng đều đặn)
    if (user.currentStreak >= 7 && user.currentStreak % 7 === 0) {
      const weeklyReward = 5; // Mỗi tuần 5 gems
      totalReward += weeklyReward;
      rewards.push({
        type: 'weekly bonus',
        amount: weeklyReward,
        reason: `Week ${user.currentStreak / 7} completed`
      });
    }

    let reward: { type: string; amount: number; milestone: number; details?: any } | null = null;
    
    if (totalReward > 0) {
      user.totalGems += totalReward;
      reward = { 
        type: 'gems', 
        amount: totalReward, 
        milestone: user.currentStreak,
        details: rewards 
      };
    }

    await this.usersRepository.save(user);
    return { currentStreak: user.currentStreak, learnedToday: true, reward };
  }

}