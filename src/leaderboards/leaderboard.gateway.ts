import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LeaderboardService } from './leaderboards.service';

@WebSocketGateway({ 
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  namespace: '/leaderboard'
})
export class LeaderboardGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly leaderboardService: LeaderboardService) {}

  // Client gửi: { limit?: number }
  @SubscribeMessage('getLeaderboard')
  async handleGetLeaderboard(
    @MessageBody() data: { limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const leaderboard = await this.leaderboardService.getTopUsers(data.limit || 10);
      
      // Emit về client đã request
      client.emit('leaderboardData', {
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      client.emit('leaderboardError', {
        success: false,
        message: error.message,
      });
    }
  }

  // Client gửi: { userId: number }
  @SubscribeMessage('getUserRank')
  async handleGetUserRank(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userRank = await this.leaderboardService.getUserRank(data.userId);
      
      client.emit('userRankData', {
        success: true,
        data: userRank,
      });
    } catch (error) {
      client.emit('userRankError', {
        success: false,
        message: error.message,
      });
    }
  }

  // Gửi realtime update khi có user tăng XP
  async broadcastLeaderboardUpdate(updatedUserId?: number) {
    try {
      const leaderboard = await this.leaderboardService.getTopUsers(10);
      
      // Broadcast tới tất cả clients
      this.server.emit('leaderboardUpdate', {
        leaderboard,
        updatedUserId, // ID của user vừa tăng XP (optional)
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error broadcasting leaderboard update:', error);
    }
  }

  // Gửi update rank của 1 user cụ thể
  async broadcastUserRankUpdate(userId: number) {
    try {
      const userRank = await this.leaderboardService.getUserRank(userId);
      
      // Có thể emit tới room của user đó hoặc tất cả clients
      this.server.emit('userRankUpdate', {
        userRank,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error broadcasting user rank update:', error);
    }
  }

  // Client join room để nhận updates
  @SubscribeMessage('joinLeaderboard')
  handleJoinLeaderboard(@ConnectedSocket() client: Socket) {
    client.join('leaderboard');
    client.emit('joinedLeaderboard', { message: 'Joined leaderboard updates' });
  }

  // Client leave room
  @SubscribeMessage('leaveLeaderboard')
  handleLeaveLeaderboard(@ConnectedSocket() client: Socket) {
    client.leave('leaderboard');
    client.emit('leftLeaderboard', { message: 'Left leaderboard updates' });
  }
}