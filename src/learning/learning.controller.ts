import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { LearningService } from './learning.service';

@Controller('learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Post('quiz/complete') // Hoàn thành quiz và cập nhật XP
  completeQuiz(@Body() body: { userId: number; quizId: number; score: number }) {
    return this.learningService.completeQuiz(body.userId, body.quizId, body.score);
  }

  @Post('flashcard/complete')  // Hoàn thành flashcard và cập nhật XP
  completeFlashcard(@Body() body: { userId: number; flashcardId: number }) {
    return this.learningService.completeFlashcard(body.userId, body.flashcardId);
  }

  @Get('xp/:userId')  // Lấy tổng XP của người dùng
  getUserXP(@Param('userId') userId: number) {
    return this.learningService.getUserXP(userId);
  }

  @Get('progress/course/:courseId')  // Lấy tiến độ khóa học của người dùng
  getCourseProgress(@Param('courseId') courseId: number, @Query('userId') userId: number) {
    return this.learningService.getCourseProgress(userId, courseId);
  }

  @Get('progress/lesson/:lessonId')  // Lấy tiến độ bài học của người dùng
  getLessonProgress(@Param('lessonId') lessonId: number, @Query('userId') userId: number) {
    return this.learningService.getLessonProgress(userId, lessonId);
  }

  @Get('stats/daily')  // Lấy thống kê học tập hàng ngày của người dùng
  getDailyStats(@Query('userId') userId: number, @Query('date') date: string) {
    return this.learningService.getDailyStats(userId, date);
  }

  @Get('history')  // Lấy lịch sử học tập của người dùng
  getLearningHistory(@Query('userId') userId: number) {
    return this.learningService.getLearningHistory(userId);
  }
}