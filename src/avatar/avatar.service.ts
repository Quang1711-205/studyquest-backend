// src/avatars/avatars.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avatar } from './entities/avatar.entity';

@Injectable()
export class AvatarsService {
  constructor(
    @InjectRepository(Avatar)
    private avatarsRepository: Repository<Avatar>,
  ) {}

  // Lấy tất cả avatars có sẵn trong hệ thống
  async findAll(): Promise<Avatar[]> {
    return this.avatarsRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
  }

  // Lấy avatars miễn phí (price = 0)
  async findFree(): Promise<Avatar[]> {
    return this.avatarsRepository.find({
      where: { isActive: true, price: 0 },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
  }

  // Lấy avatars theo rarity
  async findByRarity(rarity: 'common' | 'rare' | 'epic' | 'legendary'): Promise<Avatar[]> {
    return this.avatarsRepository.find({
      where: { isActive: true, rarity },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
  }

  // Lấy 1 avatar theo ID
  async findOne(id: number): Promise<Avatar | null> {
    return this.avatarsRepository.findOne({ 
      where: { id, isActive: true } 
    });
  }
}