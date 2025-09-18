import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Avatar } from 'src/avatar/entities/avatar.entity';
import { UserAvatar } from './entities/user-avatar.entity'; // ✅ Import UserAvatar entity

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Avatar)
    private avatarsRepository: Repository<Avatar>,
    // ✅ Thêm UserAvatar repository vào constructor
    @InjectRepository(UserAvatar)
    private userAvatarsRepository: Repository<UserAvatar>,
  ) {}

  async updateAvatar(userId: number, avatarUrl: string) {
    await this.usersRepository.update(userId, { avatarUrl });
    return { message: 'Avatar updated' };
  }

async updateStats(
  userId: number,
  stats: { xp?: number; streak?: number; gems?: number },
) {
  const user = await this.usersRepository.findOneBy({ id: userId });
  if (!user) throw new Error("User not found");

  await this.usersRepository.update(userId, {
    ...(stats.xp !== undefined && { totalXp: user.totalXp + stats.xp }),
    ...(stats.streak !== undefined && { currentStreak: user.currentStreak + stats.streak }),
    ...(stats.gems !== undefined && { totalGems: user.totalGems + stats.gems }),
  });

  return { message: 'Stats updated' };
}


  private normalizeDate(d: Date): string {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  async getStreakStatus(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return null;

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

    let totalReward = 0;
    const rewards: Array<{ type: string; amount: number; reason: string }> = [];

    const specialMilestones: Record<number, number> = {
      3: 15,
      10: 30,
      50: 100,
      365: 1000
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

    if (user.currentStreak >= 7 && user.currentStreak % 7 === 0) {
      const weeklyReward = 5;
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

  async setupProfile(
    userId: number,
    body: { languageId: number; studyMinutesPerDay: number; avatarId: number }
  ) {
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatar = await this.avatarsRepository.findOne({
      where: { id: body.avatarId, isActive: true }
    });
    if (!avatar) {
      throw new BadRequestException('Avatar not found');
    }

    if (avatar.price > 0) {
      const ownedAvatar = await this.userAvatarsRepository.findOne({
        where: { userId, avatarId: body.avatarId }
      });
      if (!ownedAvatar) {
        throw new BadRequestException('You must purchase this avatar first');
      }
    }

    const result = await this.usersRepository.update(
      { id: userId },
      {
        defaultLanguageId: body.languageId,
        studyMinutesPerDay: body.studyMinutesPerDay,
        currentAvatarId: body.avatarId,
      }
    );

    await this.giveAvatarToUser(userId, body.avatarId, true);

    return { 
      success: true, 
      message: 'Profile setup completed',
      affected: result.affected 
    };
  }

  async giveAvatarToUser(userId: number, avatarId: number, equip: boolean = false) {
    const existing = await this.userAvatarsRepository.findOne({
      where: { userId, avatarId }
    });

    if (!existing) {
      const userAvatar = this.userAvatarsRepository.create({
        userId,
        avatarId,
        isEquipped: equip
      });
      await this.userAvatarsRepository.save(userAvatar);
    }

    if (equip) {
      await this.userAvatarsRepository.update(
        { userId, isEquipped: true },
        { isEquipped: false }
      );
      
      await this.userAvatarsRepository.update(
        { userId, avatarId },
        { isEquipped: true }
      );

      await this.usersRepository.update({ id: userId }, { currentAvatarId: avatarId });
    }

    return { success: true };
  }

  async purchaseAvatar(userId: number, avatarId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatar = await this.avatarsRepository.findOne({
      where: { id: avatarId, isActive: true }
    });
    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }

    const existing = await this.userAvatarsRepository.findOne({
      where: { userId, avatarId }
    });
    if (existing) {
      throw new BadRequestException('You already own this avatar');
    }

    if (user.totalGems < avatar.price) {
      throw new BadRequestException(`Insufficient gems. Required: ${avatar.price}, You have: ${user.totalGems}`);
    }
    if (user.level < avatar.unlockLevel) {
      throw new BadRequestException(`Requires level ${avatar.unlockLevel}. Current level: ${user.level}`);
    }

    await this.usersRepository.update(
      { id: userId },
      { totalGems: user.totalGems - avatar.price }
    );

    await this.giveAvatarToUser(userId, avatarId);

    return {
      success: true,
      message: 'Avatar purchased successfully',
      remainingGems: user.totalGems - avatar.price
    };
  }

  async equipAvatar(userId: number, avatarId: number) {
    const userAvatar = await this.userAvatarsRepository.findOne({
      where: { userId, avatarId }
    });

    if (!userAvatar) {
      throw new BadRequestException('You do not own this avatar');
    }

    await this.giveAvatarToUser(userId, avatarId, true);
    return { success: true, message: 'Avatar equipped successfully' };
  }

  async getUserAvatars(userId: number) {
    return await this.userAvatarsRepository.find({
      where: { userId },
      relations: ['avatar'],
      order: { purchasedAt: 'DESC' }
    });
  }

  async getUserEquippedAvatar(userId: number) {
    return await this.userAvatarsRepository.findOne({
      where: { userId, isEquipped: true },
      relations: ['avatar']
    });
  }

  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      relations: ['currentAvatar']
    });
    if (!user) throw new NotFoundException('User not found');
    
    const { passwordHash, ...result } = user;
    return result;
  }


    async getHearts(userId: number): Promise<number> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user.hearts;
  }

  /**
   * Cập nhật hearts an toàn:
   * - Nếu client gửi reportedHearts, server chỉ chấp nhận nếu reportedHearts < current hearts (không cho tăng).
   * - Nếu action === 'decrement', server giảm theo amount (mặc định 1).
   *
   * Trả về object: { hearts: number, outOfHearts: boolean }
   */
  async updateHearts(userId: number, payload: {
    reportedHearts?: number;
    action?: 'decrement' | 'set';
    amount?: number;
  }): Promise<{ hearts: number; outOfHearts: boolean }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let newHearts = user.hearts;

    if (payload.action === 'decrement') {
      const amount = payload.amount && payload.amount > 0 ? payload.amount : 1;
      newHearts = Math.max(0, user.hearts - amount);
    } else if (payload.action === 'set' && typeof payload.reportedHearts === 'number') {
      // Chỉ cho phép set xuống (report lower), không cho tăng từ client
      if (payload.reportedHearts < user.hearts) {
        newHearts = Math.max(0, payload.reportedHearts);
      } else {
        // Nếu client cố set lớn hơn, bỏ qua (hoặc raise)
        // Chúng ta chọn bỏ qua update để an toàn
        newHearts = user.hearts;
      }
    } else if (typeof payload.reportedHearts === 'number') {
      // Nếu chỉ gửi reportedHearts mà không action: cho phép set xuống (không cho tăng)
      if (payload.reportedHearts < user.hearts) {
        newHearts = Math.max(0, payload.reportedHearts);
      } // else bỏ qua
    } else {
      throw new BadRequestException('No valid update action or reportedHearts provided');
    }

    if (newHearts !== user.hearts) {
      // Cập nhật DB
      await this.usersRepository.update(userId, { hearts: newHearts });
    }

    return { hearts: newHearts, outOfHearts: newHearts === 0 };
  }
}