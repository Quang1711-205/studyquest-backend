// src/avatars/avatars.controller.ts
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AvatarsService } from './avatar.service';

@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  // GET /avatars - Lấy tất cả avatars có sẵn trong hệ thống
  @Get()
  async getAllAvatars() {
    return this.avatarsService.findAll();
  }

  // GET /avatars/free - Lấy avatars miễn phí (cho profile setup)
  @Get('free')
  async getFreeAvatars() {
    return this.avatarsService.findFree();
  }

  // GET /avatars/rarity/legendary - Lấy avatars theo độ hiếm
  @Get('rarity/:rarity')
  async getAvatarsByRarity(@Param('rarity') rarity: string) {
    const validRarities = ['common', 'rare', 'epic', 'legendary'];
    if (!validRarities.includes(rarity)) {
      return { error: 'Invalid rarity. Use: common, rare, epic, legendary' };
    }
    return this.avatarsService.findByRarity(rarity as any);
  }

  // GET /avatars/:id - Lấy thông tin 1 avatar
  @Get(':id')
  async getAvatar(@Param('id', ParseIntPipe) id: number) {
    return this.avatarsService.findOne(id);
  }
}