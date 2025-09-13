import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('items') // Lấy danh sách tất cả các mặt hàng trong cửa hàng
  async getAvailableItems() {
    return this.storeService.getAvailableItems();
  }

  @Get('user/:userId/items') // Lấy danh sách mặt hàng mà người dùng đã mua
  async getUserItems(@Param('userId', ParseIntPipe) userId: number) {
    return this.storeService.getUserItems(userId);
  }

  @Post('purchase')  // Mua một mặt hàng từ cửa hàng
  async purchaseItem(
    @Body('userId', ParseIntPipe) userId: number,
    @Body('storeItemId', ParseIntPipe) storeItemId: number,
  ) {
    return this.storeService.purchaseItem(userId, storeItemId);
  }
}
