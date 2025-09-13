import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { LeaderboardService } from './leaderboards.service';

@WebSocketGateway({ cors: true })
export class LeaderboardGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly leaderboardService: LeaderboardService) {}

  // Client gửi: { periodType: 'weekly' | 'monthly' }
  @SubscribeMessage('getLeaderboard')
  async handleGetLeaderboard(@MessageBody() data: { periodType: 'weekly' | 'monthly' }) {
    const leaderboard = await this.leaderboardService.getTop(data.periodType);
    return leaderboard.map((entry) => ({
      userId: entry.userId,
      username: entry.user?.username,
      avatarUrl: entry.user?.avatarUrl,
      xpEarned: entry.xpEarned,
      currentRank: entry.currentRank,
    }));
  }

  // Gửi realtime khi có cập nhật (gọi hàm này ở service khi có user tăng XP)
  async broadcastLeaderboard(periodType: 'weekly' | 'monthly') {
    const leaderboard = await this.leaderboardService.getTop(periodType);
    this.server.emit('leaderboardUpdate', {
      periodType,
      leaderboard: leaderboard.map((entry) => ({
        userId: entry.userId,
        username: entry.user?.username,
        avatarUrl: entry.user?.avatarUrl,
        xpEarned: entry.xpEarned,
        currentRank: entry.currentRank,
      })),
    });
  }
}