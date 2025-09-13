import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserItems } from 'src/users/entities/UserItems.entity';
import { StoreItem } from './entities/store.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(StoreItem)
    private readonly storeItemRepo: Repository<StoreItem>,
    @InjectRepository(UserItems)
    private readonly userItemsRepo: Repository<UserItems>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Lấy danh sách item trong store
  async getAvailableItems() {
    return this.storeItemRepo.find({
      where: { isAvailable: true },
      order: { sortOrder: 'ASC', gemCost: 'ASC' },
    });
  }

  // Cho user mua item
  async purchaseItem(userId: number, storeItemId: number) {
    const item = await this.storeItemRepo.findOne({ where: { id: storeItemId, isAvailable: true } });
    if (!item) throw new NotFoundException('Item not found or unavailable');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.totalGems < item.gemCost) {
      throw new BadRequestException('Not enough gems to purchase this item');
    }

    // Trừ gems
    user.totalGems -= item.gemCost;
    await this.userRepo.save(user);

    // Nếu là cosmetic (avatar), có thể update avatar_url trực tiếp
    if (item.itemType === 'cosmetic' && item.itemData?.avatarUrl) {
      user.avatarUrl = item.itemData.avatarUrl;
      await this.userRepo.save(user);
    }

    // Thêm item vào inventory
    const userItem = this.userItemsRepo.create({
      userId,
      storeItemId: item.id,
      quantity: 1,
    });
    await this.userItemsRepo.save(userItem);

    return {
      message: 'Purchase successful',
      remainingGems: user.totalGems,
      purchasedItem: item,
    };
  }


  // Lấy item user đã sở hữu
  async getUserItems(userId: number) {
    return this.userItemsRepo.find({ where: { userId } });
  }
}
