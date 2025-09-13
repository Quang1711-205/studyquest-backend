import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Leaderboard } from './entities/Leaderboard.entity';
import { User } from '../users/entities/user.entity';
import { LeaderboardService } from './leaderboards.service';
import { LeaderboardGateway } from './leaderboard.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Leaderboard, User])],
  providers: [LeaderboardService, LeaderboardGateway],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}