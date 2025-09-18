import { 
  Controller, 
  Get,
  Param,
  Query,
  BadRequestException 
} from '@nestjs/common';
import { QuestionService } from './question.service';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // NEW: Lấy questions chỉ từ courseId (courseId -> lessons -> questions)
  @Get('by-course/:courseId')
  async getQuestionsByCourseId(
    @Param('courseId') courseIdStr: string,
    @Query('category') quizCategory?: 'vocabulary' | 'grammar' | 'listening',
    @Query('level') quizLevel?: 'basic' | 'advanced',
    @Query('type') questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching',
    @Query('difficulty') difficulty?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('onlyActive') onlyActive?: string
  ) {
    try {
      const courseId = parseInt(courseIdStr);

      if (isNaN(courseId)) {
        throw new BadRequestException('courseId must be a valid number');
      }

      const options = {
        quizCategory,
        quizLevel,
        questionType,
        difficulty: difficulty ? parseInt(difficulty) : undefined,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
        onlyActive: onlyActive !== 'false',
      };

      return await this.questionService.getQuestionsByCourseId(courseId, options);
    } catch (error) {
      throw new BadRequestException(`Failed to get questions: ${error.message}`);
    }
  }

  // NEW: Simple version - chỉ lấy danh sách questions từ courseId
  @Get('simple/by-course/:courseId')
  async getQuestionsByCourseIdSimple(
    @Param('courseId') courseIdStr: string,
    @Query('category') quizCategory?: 'vocabulary' | 'grammar' | 'listening',
    @Query('level') quizLevel?: 'basic' | 'advanced',
    @Query('type') questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching',
    @Query('onlyActive') onlyActive?: string
  ) {
    try {
      const courseId = parseInt(courseIdStr);

      if (isNaN(courseId)) {
        throw new BadRequestException('courseId must be a valid number');
      }

      return await this.questionService.getQuestionsByCourseIdSimple(courseId, {
        quizCategory,
        quizLevel,
        questionType,
        onlyActive: onlyActive !== 'false',
      });
    } catch (error) {
      throw new BadRequestException(`Failed to get questions: ${error.message}`);
    }
  }

  // 1. Lấy questions từ courseId + languageId
  @Get('by-course-language/:courseId/:languageId')
  async getQuestionsByCourseAndLanguage(
    @Param('courseId') courseIdStr: string,
    @Param('languageId') languageIdStr: string,
    @Query('category') quizCategory?: 'vocabulary' | 'grammar' | 'listening',
    @Query('level') quizLevel?: 'basic' | 'advanced',
    @Query('type') questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching',
    @Query('difficulty') difficulty?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('onlyActive') onlyActive?: string
  ) {
    try {
      // Manual validation and conversion
      const courseId = parseInt(courseIdStr);
      const languageId = parseInt(languageIdStr);

      if (isNaN(courseId) || isNaN(languageId)) {
        throw new BadRequestException('courseId and languageId must be valid numbers');
      }

      const options = {
        quizCategory,
        quizLevel,
        questionType,
        difficulty: difficulty ? parseInt(difficulty) : undefined,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
        onlyActive: onlyActive !== 'false',
      };

      return await this.questionService.getQuestionsByCourseAndLanguage(
        courseId,
        languageId,
        options
      );
    } catch (error) {
      throw new BadRequestException(`Failed to get questions: ${error.message}`);
    }
  }

  // 2. Lấy questions từ lessonIds
  @Get('by-lessons')
  async getQuestionsByLessonIds(
    @Query('lessonIds') lessonIds: string,
    @Query('category') quizCategory?: 'vocabulary' | 'grammar' | 'listening',
    @Query('level') quizLevel?: 'basic' | 'advanced',
    @Query('type') questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching',
    @Query('onlyActive') onlyActive?: string
  ) {
    try {
      if (!lessonIds) {
        throw new BadRequestException('lessonIds parameter is required');
      }

      const lessonIdArray = lessonIds.split(',').map(id => {
        const parsed = parseInt(id.trim());
        if (isNaN(parsed)) {
          throw new BadRequestException(`Invalid lesson ID: ${id}`);
        }
        return parsed;
      });

      return await this.questionService.getQuestionsByLessonIds(lessonIdArray, {
        quizCategory,
        quizLevel,
        questionType,
        onlyActive: onlyActive !== 'false',
      });
    } catch (error) {
      throw new BadRequestException(`Failed to get questions by lesson IDs: ${error.message}`);
    }
  }

  // 3. Flow complete: courseId + languageId → lessons → questions
  @Get('flow/:courseId/:languageId')
  async getQuestionsFlow(
    @Param('courseId') courseIdStr: string,
    @Param('languageId') languageIdStr: string,
    @Query('category') quizCategory?: 'vocabulary' | 'grammar' | 'listening',
    @Query('level') quizLevel?: 'basic' | 'advanced',
    @Query('type') questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching'
  ) {
    try {
      // Manual validation and conversion
      const courseId = parseInt(courseIdStr);
      const languageId = parseInt(languageIdStr);

      if (isNaN(courseId) || isNaN(languageId)) {
        throw new BadRequestException('courseId and languageId must be valid numbers');
      }

      return await this.questionService.getQuestionsFlowByCourseLanguage(
        courseId,
        languageId,
        {
          quizCategory,
          quizLevel,
          questionType,
        }
      );
    } catch (error) {
      throw new BadRequestException(`Failed to get questions flow: ${error.message}`);
    }
  }

  // 4. Helper: Lấy lessons từ courseId + languageId
  @Get('lessons/by-course-language/:courseId/:languageId')
  async getLessonsByCourseAndLanguage(
    @Param('courseId') courseIdStr: string,
    @Param('languageId') languageIdStr: string,
    @Query('onlyActive') onlyActive?: string
  ) {
    try {
      // Manual validation and conversion
      const courseId = parseInt(courseIdStr);
      const languageId = parseInt(languageIdStr);

      if (isNaN(courseId) || isNaN(languageId)) {
        throw new BadRequestException('courseId and languageId must be valid numbers');
      }

      return await this.questionService.getLessonsByCourseAndLanguage(
        courseId,
        languageId,
        onlyActive !== 'false'
      );
    } catch (error) {
      throw new BadRequestException(`Failed to get lessons: ${error.message}`);
    }
  }

  // NEW: Helper - Lấy lessons chỉ từ courseId
  @Get('lessons/by-course/:courseId')
  async getLessonsByCourseId(
    @Param('courseId') courseIdStr: string,
    @Query('onlyActive') onlyActive?: string
  ) {
    try {
      const courseId = parseInt(courseIdStr);

      if (isNaN(courseId)) {
        throw new BadRequestException('courseId must be a valid number');
      }

      // Sử dụng lessonRepo trực tiếp hoặc tạo method mới trong service
      return await this.questionService.getLessonsByCourseId(courseId, onlyActive !== 'false');
    } catch (error) {
      throw new BadRequestException(`Failed to get lessons: ${error.message}`);
    }
  }

  // 5. Health check
  @Get('health')
  healthCheck() {
    return { 
      status: 'OK', 
      message: 'Questions service is running',
      endpoints: [
        'GET /questions/by-course/:courseId - Lấy questions từ courseId (có pagination & filters)',
        'GET /questions/simple/by-course/:courseId - Lấy questions đơn giản từ courseId',
        'GET /questions/by-course-language/:courseId/:languageId',
        'GET /questions/by-lessons?lessonIds=1,2,3',
        'GET /questions/flow/:courseId/:languageId',
        'GET /questions/lessons/by-course-language/:courseId/:languageId',
        'GET /questions/lessons/by-course/:courseId'
      ]
    };
  }

  // Thêm vào QuestionController
@Get('all')
async getAllQuestions(
  @Query('category') quizCategory?: 'vocabulary' | 'grammar' | 'listening',
  @Query('level') quizLevel?: 'basic' | 'advanced',
  @Query('type') questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching',
  @Query('difficulty') difficulty?: string,
  @Query('limit') limit?: string,
  @Query('offset') offset?: string,
  @Query('search') search?: string,
  @Query('onlyActive') onlyActive?: string
) {
  try {
    const options = {
      quizCategory,
      quizLevel,
      questionType,
      difficulty: difficulty ? parseInt(difficulty) : undefined,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      search,
      onlyActive: onlyActive !== 'false',
    };

    return await this.questionService.getAllQuestions(options);
  } catch (error) {
    throw new BadRequestException(`Failed to get all questions: ${error.message}`);
  }
}

// Simple version
@Get('all/simple')
async getAllQuestionsSimple(
  @Query('category') quizCategory?: 'vocabulary' | 'grammar' | 'listening',
  @Query('level') quizLevel?: 'basic' | 'advanced',
  @Query('type') questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching',
  @Query('limit') limit?: string,
  @Query('offset') offset?: string,
  @Query('onlyActive') onlyActive?: string
) {
  try {
    return await this.questionService.getAllQuestionsSimple({
      quizCategory,
      quizLevel,
      questionType,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      onlyActive: onlyActive !== 'false',
    });
  } catch (error) {
    throw new BadRequestException(`Failed to get all questions: ${error.message}`);
  }
}
@Get('raw')
async getAllQuestionsRaw() {
  try {
    return await this.questionService.getAllQuestionsRaw();
  } catch (error) {
    throw new BadRequestException(`Failed to get questions: ${error.message}`);
  }
}

@Get('raw/with-relations') 
async getAllQuestionsWithRelations() {
  try {
    return await this.questionService.getAllQuestionsWithRelations();
  } catch (error) {
    throw new BadRequestException(`Failed to get questions: ${error.message}`);
  }
}

@Get('raw/limit/:limit')
async getAllQuestionsLimit(@Param('limit') limit: string) {
  try {
    const limitNum = parseInt(limit) || 50;
    return await this.questionService.getAllQuestionsLimit(limitNum);
  } catch (error) {
    throw new BadRequestException(`Failed to get questions: ${error.message}`);
  }
}
@Get('test/raw')
async testRawQuery() {
  try {
    return await this.questionService.testRawQuery();
  } catch (error) {
    throw new BadRequestException(`Raw query failed: ${error.message}`);
  }
}
}