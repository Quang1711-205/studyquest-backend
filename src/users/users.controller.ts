import { Controller, Get, Patch, Body, UseGuards, Request, Post, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')  // Lấy thông tin hồ sơ người dùng
  getProfile(@Request() req) {
    console.log('req.user:', req.user);
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('avatar') // Cập nhật ảnh đại diện người dùng
  updateAvatar(@Request() req, @Body('avatarUrl') avatarUrl: string) {
    return this.usersService.updateAvatar(req.user.userId, avatarUrl);
  }

  @Patch('stats')  // Cập nhật thống kê người dùng (XP, streak, gems)
  updateStats(
    @Request() req,
    @Body() body: { xp?: number; streak?: number; gems?: number },
  ) {
    return this.usersService.updateStats(req.user.userId, body);
  }

  // Lấy trạng thái streak của người dùng
  @Get(':id/streak')
  async getStreak(@Param('id', ParseIntPipe) userId: number) {
    const streak = await this.usersService.getStreakStatus(userId);
    if (!streak) {
      return { message: 'User not found' };
    }
    return streak;
  }


  @Post(':id/streak')
  async updateStreak(@Param('id', ParseIntPipe) userId: number) {
    const today = new Date();
    const result = await this.usersService.updateStreakHybrid(userId, today);
    if (!result) {
      return { message: 'User not found' };
    }
    return result;
  }
}