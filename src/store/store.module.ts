import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreItem } from './entities/store.entity';
import { User } from 'src/users/entities/user.entity';
import { UserItems } from 'src/users/entities/UserItems.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoreItem, User, UserItems])],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}
