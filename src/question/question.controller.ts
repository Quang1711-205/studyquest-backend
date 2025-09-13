import { Controller, Post, Body, Get, Query, BadRequestException } from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/createQuestionDTO';
import { QuizCategory, QuizLevel } from './dto/createQuestionDTO';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post("/create") // Tạo câu hỏi mới (admin)
  async create(@Body() dto: CreateQuestionDto) {
    return this.questionService.create(dto);
  }

  // Lấy quiz theo ngôn ngữ, loại, cấp độ
  @Get()
  async getQuizByLanguage(
    @Query('languageId') languageId: string,  // Query params luôn là string
    @Query('quizCategory') quizCategory: string,
    @Query('quizLevel') quizLevel: string,
  ) {
    // Validate và convert languageId
    const languageIdNum = parseInt(languageId);
    if (isNaN(languageIdNum)) {
      throw new BadRequestException('Invalid languageId - must be a number');
    }

    // Validate enum values
    const validCategories: QuizCategory[] = ['vocabulary', 'grammar', 'listening'];
    const validLevels: QuizLevel[] = ['basic', 'advanced'];
    
    if (!validCategories.includes(quizCategory as QuizCategory)) {
      throw new BadRequestException(`Invalid quiz category. Must be one of: ${validCategories.join(', ')}`);
    }
    
    if (!validLevels.includes(quizLevel as QuizLevel)) {
      throw new BadRequestException(`Invalid quiz level. Must be one of: ${validLevels.join(', ')}`);
    }

    return this.questionService.findByLanguage(
      languageIdNum, 
      quizCategory as QuizCategory, 
      quizLevel as QuizLevel
    );
  }

  // Lấy tất cả quiz (admin)

  @Get('all')
  async getAll() {
    return this.questionService.findAll();
  }

}

