import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  ParseIntPipe, 
  HttpCode, 
  HttpStatus,
  BadRequestException,
  Query,
  Put
} from '@nestjs/common';
import { AiService } from './ai.service';

// Existing DTOs
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { QuizResponseDto } from './dto/quiz-response.dto';

// Updated type definitions to match service
interface LearningStep {
  title: string;
  description: string;
  lessonType: 'vocabulary' | 'grammar' | 'listening' | 'mixed';
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  topics: string[];
}

// Updated ProcessedPathData to include languageCode
interface ProcessedPathData {
  title: string;
  description: string;
  estimatedDuration: string;
  targetLevel: 'beginner' | 'intermediate' | 'advanced';
  steps: LearningStep[];
  totalSteps: number;
  preferences: string[];
  languageCode: string; // Add language context
}

interface QuizStructure {
  grammar: {
    basicToMedium: number;
    hard: number;
  };
  listening: {
    basicToMedium: number;
    hard: number;
  };
  total: number;
}

// User language progress interface (matching service)
interface UserLanguageProgress {
  hasLearningPath: boolean;
  completedLessons: number;
  totalLessons: number;
  currentLevel: string;
  lastActivity: Date | null;
  suggestedAction: 'continue' | 'new_path' | 'review';
}

// Updated response interfaces to handle both types of responses
interface BaseSuggestPathResponse {
  success: boolean;
  message: string;
}

interface NewPathResponse extends BaseSuggestPathResponse {
  data: {
    userId: number;
    username: string;
    language: string;
    languageCode: string;
    currentProgress: UserLanguageProgress;
    pathData: ProcessedPathData;
    quizStructure: QuizStructure;
    isConfirmed: boolean;
    needsConfirmation: boolean;
  };
}

interface ContinuationResponse extends BaseSuggestPathResponse {
  data: {
    userId: number;
    language: string;
    languageCode: string;
    currentProgress: UserLanguageProgress;
    suggestion: {
      action: string;
      message: string;
      nextSteps: string[];
    };
    existingPath: any; // AiSuggestedPath type
    needsNewPath: boolean;
  };
}

// Union type for suggest path response
type SuggestPathResponseDto = NewPathResponse | ContinuationResponse;

interface ConfirmPathResponseDto {
  success: boolean;
  message: string;
  data: {
    pathId: number;
    userId: number;
    courseId: number;
    language: string;
    languageCode: string;
    title: string;
    totalLessons: number;
    quizStructure: QuizStructure;
    quizResults: any;
    createdAt: Date;
    lessons: any[];
  };
}

// Updated request interfaces
interface EnhancedSuggestLearningPathDto {
  userId: number;
  preferences: string[];
  targetCourse?: string;
  // Removed targetLanguage since service doesn't use it anymore
}

interface ConfirmLearningPathDto {
  userId: number;
  courseId: number;
  pathData: ProcessedPathData; // Now includes languageCode
}

interface UpdateQuestProgressDto {
  userId: number;
  action: {
    type: 'quiz_completed' | 'question_answered' | 'lesson_completed';
    data: {
      score?: number;
      accuracy?: number;
      category?: 'grammar' | 'listening' | 'vocabulary';
      level?: 'basic' | 'advanced';
      xpEarned?: number;
      languageCode?: string; // Add language context
    };
  };
}

export interface UserLanguageContextResponse {
  user: {
    id: number;
    username: string;
    level: number;
    totalXp: number;
    defaultLanguageId?: number;
    lastActivityDate?: Date;
  };
  selectedLanguage: {
    id: number;
    name: string;
    code: string;
  } | null;
  progress: UserLanguageProgress;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ============= QUIZ ENDPOINTS =============
  @Post('generate-quiz')
  @HttpCode(HttpStatus.CREATED)
  async generateQuiz(@Body() generateQuizDto: GenerateQuizDto): Promise<QuizResponseDto> {
    try {
      return await this.aiService.generateQuiz(
        generateQuizDto.userId, 
        generateQuizDto.text
      );
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('NotFoundException')) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('quiz/:id')
  async getQuiz(@Param('id', ParseIntPipe) id: number) {
    return this.aiService.getQuiz(id);
  }

  @Get('user/:userId/quizzes')
  async getUserQuizzes(@Param('userId', ParseIntPipe) userId: number) {
    return this.aiService.getUserQuizzes(userId);
  }

  // ============= LEARNING PATH ENDPOINTS =============
  @Post('suggest-learning-path')
  @HttpCode(HttpStatus.CREATED)
  async suggestLearningPath(
    @Body() suggestPathDto: EnhancedSuggestLearningPathDto
  ): Promise<SuggestPathResponseDto> {
    try {
      // Fixed: Only pass the parameters that the service expects
      return await this.aiService.suggestLearningPath(
        suggestPathDto.userId, 
        suggestPathDto.preferences,
        suggestPathDto.targetCourse
      );
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('NotFoundException')) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('confirm-learning-path')  
  @HttpCode(HttpStatus.CREATED)
  async confirmAndCreateLearningPath(@Body() confirmDto: ConfirmLearningPathDto): Promise<ConfirmPathResponseDto> {
    try {
      return await this.aiService.confirmAndCreateLearningPath(
        confirmDto.userId,
        confirmDto.pathData, // Now includes languageCode
        confirmDto.courseId
      );
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('NotFoundException')) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('learning-path/:id')
  async getLearningPath(@Param('id', ParseIntPipe) id: number) {
    return this.aiService.getLearningPath(id);
  }

  @Get('user/:userId/learning-paths')
  async getUserLearningPaths(@Param('userId', ParseIntPipe) userId: number) {
    return this.aiService.getUserLearningPaths(userId);
  }

  // ============= LANGUAGE CONTEXT ENDPOINT =============
  @Get('user/:userId/language-context')
  async getUserLanguageContext(
    @Param('userId', ParseIntPipe) userId: number
  ): Promise<UserLanguageContextResponse> {
    try {
      return await this.aiService.getUserLanguageContext(userId);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('NotFoundException')) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  // ============= DAILY QUEST ENDPOINTS =============
  @Post('daily-quests/generate')
  @HttpCode(HttpStatus.CREATED)
  async generateDailyQuests(@Query('date') date?: string) {
    try {
      const questDate = date ? new Date(date) : new Date();
      return await this.aiService.generateDailyQuests(questDate);
    } catch (error) {
      throw new BadRequestException('Failed to generate daily quests: ' + error.message);
    }
  }

  @Post('daily-quests/assign/:userId')
  @HttpCode(HttpStatus.CREATED)
  async assignDailyQuestsToUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('date') date?: string
  ) {
    try {
      const questDate = date ? new Date(date) : new Date();
      return await this.aiService.assignDailyQuestsToUser(userId, questDate);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('NotFoundException')) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('daily-quests/user/:userId')
  async getUserDailyQuests(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('date') date?: string
  ) {
    try {
      const questDate = date ? new Date(date) : new Date();
      return await this.aiService.getUserDailyQuests(userId, questDate);
    } catch (error) {
      throw new BadRequestException('Failed to get user daily quests: ' + error.message);
    }
  }

  @Put('daily-quests/progress')
  @HttpCode(HttpStatus.OK)
  async updateQuestProgress(@Body() updateDto: UpdateQuestProgressDto) {
    try {
      return await this.aiService.updateQuestProgress(updateDto.userId, updateDto.action);
    } catch (error) {
      throw new BadRequestException('Failed to update quest progress: ' + error.message);
    }
  }

  // ============= UTILITY ENDPOINTS =============
  @Get('health')
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'AI Service',
      timestamp: new Date().toISOString(),
      features: {
        quizGeneration: true,
        learningPathSuggestion: true,
        aiGeneratedQuests: true,
        questProgressTracking: true,
        languageContext: true
      },
      endpoints: {
        quiz: ['generate-quiz', 'quiz/:id', 'user/:userId/quizzes'],
        learningPath: [
          'suggest-learning-path', 
          'confirm-learning-path', 
          'learning-path/:id', 
          'user/:userId/learning-paths'
        ],
        dailyQuests: [
          'daily-quests/generate', 
          'daily-quests/assign/:userId', 
          'daily-quests/user/:userId', 
          'daily-quests/progress'
        ],
        utility: ['user/:userId/language-context', 'health']
      },
      languageSupport: {
        contextAware: true,
        multiLanguage: true,
        personalizedContent: true
      }
    };
  }
}