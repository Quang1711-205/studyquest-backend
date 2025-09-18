import { Controller, Get, Patch, Body, UseGuards, Request, Post, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

    // ✅ GET /users/:id/hearts
  @Get(':id/hearts')
  async getHearts(@Param('id', ParseIntPipe) id: number) {
    const hearts = await this.usersService.getHearts(id);
    return { hearts };
  }

  // ✅ POST /users/:id/hearts
  @Post(':id/hearts')
  async updateHearts(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: { reportedHearts?: number; action?: 'decrement' | 'set'; amount?: number },
  ) {
    return this.usersService.updateHearts(id, payload);
  }

  @Get('profile')
  getProfile(@Request() req) {
    console.log('req.user:', req.user);
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('avatar')
  updateAvatar(@Request() req, @Body('avatarUrl') avatarUrl: string) {
    return this.usersService.updateAvatar(req.user.userId, avatarUrl);
  }

  @Patch('stats')
  updateStats(
    @Request() req,
    @Body() body: { xp?: number; streak?: number; gems?: number },
  ) {
    return this.usersService.updateStats(req.user.userId, body);
  }

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

  @Patch('profile-setup')
  async setupProfile(
    @Request() req,
    @Body() body: { languageId: number; studyMinutesPerDay: number; avatarId: number }
  ) {
    console.log('Setup Profile Request:', {
      user: req.user,
      body: body
    });

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    return this.usersService.setupProfile(userId, body);
  }

  // ===== AVATAR ENDPOINTS =====

  // GET /users/avatars - Lấy danh sách avatars mà user đã sở hữu
  @Get('avatars')
  getUserAvatars(@Request() req) {
    const userId = req.user?.userId || req.user?.id;
    return this.usersService.getUserAvatars(userId);
  }

  // GET /users/avatar/equipped - Lấy avatar hiện tại đang trang bị
  @Get('avatar/equipped')
  getUserEquippedAvatar(@Request() req) {
    const userId = req.user?.userId || req.user?.id;
    return this.usersService.getUserEquippedAvatar(userId);
  }

  // POST /users/avatars/:avatarId/purchase - Mua avatar
  @Post('avatars/:avatarId/purchase')
  purchaseAvatar(
    @Request() req, 
    @Param('avatarId', ParseIntPipe) avatarId: number
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.usersService.purchaseAvatar(userId, avatarId);
  }

  // PATCH /users/avatars/:avatarId/equip - Trang bị avatar
  @Patch('avatars/:avatarId/equip')
  equipAvatar(
    @Request() req, 
    @Param('avatarId', ParseIntPipe) avatarId: number
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.usersService.equipAvatar(userId, avatarId);
  }
}