import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  ParseIntPipe, 
  HttpCode, 
  HttpStatus,
  BadRequestException 
} from '@nestjs/common';
import { AiService } from './ai.service';


import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SuggestLearningPathDto } from './dto/suggest-learning-path.dto';
import { QuizResponseDto } from './dto/quiz-response.dto';
import { LearningPathResponseDto } from './dto/learning-path-response.dto';


@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-quiz')   // AI sinh quiz theo yêu cầu của người dùng
  @HttpCode(HttpStatus.CREATED)
  async generateQuiz(@Body() generateQuizDto: GenerateQuizDto): Promise<QuizResponseDto> {
    try {
      return await this.aiService.generateQuiz(
        generateQuizDto.userId, 
        generateQuizDto.text
      );
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('NotFoundException')) {
        throw error; // Let NestJS handle NotFoundException
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('suggest-learning-path')  // AI đề xuất lộ trình học tập dựa trên sở thích của người dùng
  @HttpCode(HttpStatus.CREATED)
  async suggestLearningPath(
    @Body() suggestPathDto: SuggestLearningPathDto
  ): Promise<LearningPathResponseDto> {
    try {
      return await this.aiService.suggestLearningPath(
        suggestPathDto.userId, 
        suggestPathDto.preferences
      );
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('NotFoundException')) {
        throw error; // Let NestJS handle NotFoundException
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('quiz/:id') // Lấy quiz theo ID
  async getQuiz(@Param('id', ParseIntPipe) id: number) {
    return this.aiService.getQuiz(id);
  }

  @Get('user/:userId/quizzes') // Lấy tất cả quiz của người dùng
  async getUserQuizzes(@Param('userId', ParseIntPipe) userId: number) {
    return this.aiService.getUserQuizzes(userId);
  }

  @Get('learning-path/:id')  // Lấy lộ trình học tập theo ID
  async getLearningPath(@Param('id', ParseIntPipe) id: number) {
    return this.aiService.getLearningPath(id);
  }

  @Get('user/:userId/learning-paths')  // Lấy tất cả lộ trình học tập của người dùng
  async getUserLearningPaths(@Param('userId', ParseIntPipe) userId: number) {
    return this.aiService.getUserLearningPaths(userId);
  }
}