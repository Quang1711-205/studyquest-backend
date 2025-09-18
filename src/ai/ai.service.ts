import { Injectable, InternalServerErrorException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiGeneratedQuiz } from './entities/ai-generated-quiz.entity';
import { AiSuggestedPath } from './entities/ai-suggested-path.entity';
import { User } from '../users/entities/user.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Question } from 'src/question/entities/question.entity';
import { Course } from 'src/courses/entities/course.entity';
import { QuizAttempt } from 'src/quiz/entities/quiz-attempt.entity';
import { DailyQuest } from 'src/users/entities/dailyQuest.entity';
import { UserDailyQuest } from 'src/users/entities/UserDailyQuests.entity';
import { Language } from 'src/language/entities/language.entity';

// Định nghĩa interfaces cho dữ liệu đã được xử lý
interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface QuestData {
  category?: 'grammar' | 'listening' | 'vocabulary';
  level?: 'basic' | 'advanced';
  lessonIds?: number[];
  specificRequirements?: any;
  requiresUserLanguage?: boolean; // Add this property
}

interface ProcessedQuizData {
  questions: QuizQuestion[];
  totalQuestions: number;
  createdAt: Date;
  languageCode: string; // Add language context
}

interface LearningStep {
  title: string;
  description: string;
  lessonType: 'vocabulary' | 'grammar' | 'listening' | 'mixed';
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  topics: string[];
}

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

// Add interface for user progress
interface UserLanguageProgress {
  hasLearningPath: boolean;
  completedLessons: number;
  totalLessons: number;
  currentLevel: string;
  lastActivity: Date | null;
  suggestedAction: 'continue' | 'new_path' | 'review';
}

@Injectable()
export class AiService {
  private readonly geminiApiKey: string;
  private readonly geminiApiUrl: string;
  private readonly geminiModel: string;

  private readonly QUIZ_STRUCTURE: QuizStructure = {
    grammar: {
      basicToMedium: 2,
      hard: 1
    },
    listening: {
      basicToMedium: 2,
      hard: 1
    },
    total: 6
  };

  constructor(
    @InjectRepository(AiGeneratedQuiz)
    private readonly quizRepository: Repository<AiGeneratedQuiz>,
    @InjectRepository(AiSuggestedPath)
    private readonly pathRepository: Repository<AiSuggestedPath>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(DailyQuest)
    private readonly questRepository: Repository<DailyQuest>,
    @InjectRepository(UserDailyQuest)
    private readonly userQuestRepository: Repository<UserDailyQuest>,
    @InjectRepository(Language) // Add Language repository
    private readonly languageRepository: Repository<Language>,
    private readonly configService: ConfigService,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') ?? 'AIzaSyDTrlkXUw98NfswhBE3UG5ZpGXObnxH2no';
    this.geminiApiUrl = this.configService.get<string>('GEMINI_API_URL') ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.geminiModel = this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash-lite';
  }

  // NEW: Check user's language context and learning progress
  async getUserLanguageContext(userId: number): Promise<{
    user: User;
    selectedLanguage: Language | null;
    progress: UserLanguageProgress;
  }> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      // relations: ['defaultLanguage'] // Assuming you have this relation
    });
    
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // Get user's selected language
    let selectedLanguage: Language | null = null;
    if (user.defaultLanguageId) {
      selectedLanguage = await this.languageRepository.findOne({
        where: { id: user.defaultLanguageId }
      });
    }

    // Check user's progress in this language
    let progress: UserLanguageProgress = {
      hasLearningPath: false,
      completedLessons: 0,
      totalLessons: 0,
      currentLevel: 'beginner',
      lastActivity: null,
      suggestedAction: 'new_path'
    };

    if (selectedLanguage) {
      // Find courses for this language
      const languageCourses = await this.courseRepository.find({
        where: { languageId: selectedLanguage.id }
      });

      if (languageCourses.length > 0) {
        // Check if user has AI-generated learning paths for this language
        const existingPaths = await this.pathRepository.find({
          where: { userId },
          order: { createdAt: 'DESC' }
        });

        // Check lessons progress
        const totalLessons = await this.lessonRepository.count({
          where: { 
            courseId: languageCourses[0].id,
            isActive: true 
          }
        });

        // You might need to create a UserLessonProgress table to track this
        const completedLessons = 0; // TODO: Implement actual tracking

        progress = {
          hasLearningPath: existingPaths.length > 0,
          completedLessons,
          totalLessons,
          currentLevel: user.level > 10 ? 'advanced' : user.level > 5 ? 'intermediate' : 'beginner',
          lastActivity: user.lastActivityDate || null,
          suggestedAction: existingPaths.length > 0 ? 'continue' : 'new_path'
        };
      }
    }

    return { user, selectedLanguage, progress };
  }

  // UPDATED: Generate quiz with language context
  async generateQuiz(userId: number, text: string) {
    if (!text || text.trim() === '') {
      throw new Error('Text input cannot be empty.');
    }

    try {
      const { user, selectedLanguage } = await this.getUserLanguageContext(userId);
      
      if (!selectedLanguage) {
        throw new Error('User must select a language before generating quizzes. Please set default language in profile.');
      }

      const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
      
      const prompt = `Tạo 3 câu hỏi trắc nghiệm cho người học ${selectedLanguage.name} dựa trên nội dung: "${text}". 
      Ngôn ngữ đích: ${selectedLanguage.name} (${selectedLanguage.code})
      Cấp độ người học: ${user.level > 10 ? 'nâng cao' : user.level > 5 ? 'trung cấp' : 'cơ bản'}
      
      QUAN TRỌNG: Chỉ trả về JSON hợp lệ theo định dạng sau:
      {
        "questions": [
          {
            "question": "Câu hỏi phù hợp với ngôn ngữ ${selectedLanguage.name}",
            "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
            "answer": "Đáp án đúng"
          }
        ]
      }`;

      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
      }, {
        headers: {
          'x-goog-api-key': this.geminiApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const rawQuizData = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawQuizData) {
        throw new InternalServerErrorException('Failed to extract quiz data from Gemini API response.');
      }

      const processedQuizData = this.processQuizData(rawQuizData, selectedLanguage.code);

      const quiz = this.quizRepository.create({
        userId: user.id,
        quizData: processedQuizData,
      });
      const savedQuiz = await this.quizRepository.save(quiz);

      return {
        success: true,
        message: 'Quiz generated successfully',
        data: {
          quizId: savedQuiz.id,
          userId: user.id,
          username: user.username,
          language: selectedLanguage.name,
          languageCode: selectedLanguage.code,
          questions: processedQuizData.questions,
          questionCount: processedQuizData.totalQuestions,
          createdAt: savedQuiz.createdAt,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;

        if (status === 401) {
          throw new UnauthorizedException('Gemini API Unauthorized: ' + message);
        } else if (status === 429) {
          throw new UnauthorizedException('Gemini API Rate Limited: ' + message);
        } else if (status === 400) {
          throw new Error('Invalid request to Gemini API: ' + message);
        }
      }
      throw new InternalServerErrorException('Failed to generate quiz: ' + error.message);
    }
  }

  // UPDATED: Process quiz data with language context
  private processQuizData(rawQuizData: string, languageCode: string): ProcessedQuizData {
    try {
      let cleanedData = rawQuizData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedData = JSON.parse(cleanedData);
      
      if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
        throw new Error('Invalid quiz format: questions array not found');
      }

      const processedQuestions: QuizQuestion[] = parsedData.questions.map((q: any, index: number) => {
        if (!q.question || !q.options || !Array.isArray(q.options) || !q.answer) {
          throw new Error(`Invalid question format at index ${index}`);
        }

        return {
          question: q.question.trim(),
          options: q.options.map((option: string) => option.trim()),
          answer: q.answer.trim()
        };
      });

      return {
        questions: processedQuestions,
        totalQuestions: processedQuestions.length,
        createdAt: new Date(),
        languageCode
      };
    } catch (error) {
      console.error('Error processing quiz data:', error);
      throw new Error(`Failed to process quiz data: ${error.message}`);
    }
  }

  // UPDATED: Suggest learning path with language context
  async suggestLearningPath(userId: number, preferences: string[], targetCourse?: string) {
    if (!preferences || preferences.length === 0) {
      throw new Error('Preferences cannot be empty.');
    }

    try {
      const { user, selectedLanguage, progress } = await this.getUserLanguageContext(userId);
      
      if (!selectedLanguage) {
        throw new Error('User must select a language before generating learning paths. Please set default language in profile.');
      }

      // If user already has progress, suggest continuation or new advanced path
      if (progress.hasLearningPath && progress.suggestedAction === 'continue') {
        return this.getContinuationSuggestion(userId, selectedLanguage, progress);
      }

      const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
      
      const prompt = `Tạo lộ trình học tập cá nhân hóa cho người dùng "${user.username}":
      - Ngôn ngữ đích: ${selectedLanguage.name} (${selectedLanguage.code})
      - Sở thích: ${preferences.join(', ')}
      - Khóa học mục tiêu: ${targetCourse || 'Chưa xác định'}
      - Cấp độ hiện tại: ${progress.currentLevel}
      - Tổng XP: ${user.totalXp}
      - Đã hoàn thành: ${progress.completedLessons}/${progress.totalLessons} bài học
      
      Lưu ý: Chỉ tạo lộ trình với 2 loại bài học chính: GRAMMAR và LISTENING.
      Tạo lộ trình phù hợp với ngôn ngữ ${selectedLanguage.name} và cấp độ ${progress.currentLevel}.
      
      Hãy tạo 1 lộ trình với 6-8 bước học:
      - 3-4 bài Grammar (ngữ pháp ${selectedLanguage.name})  
      - 3-4 bài Listening (nghe hiểu ${selectedLanguage.name})
      
      QUAN TRỌNG: Chỉ trả về JSON hợp lệ theo định dạng sau:
      {
        "title": "Lộ trình học ${selectedLanguage.name}",
        "description": "Mô tả lộ trình học ${selectedLanguage.name}",
        "estimatedDuration": "4-6 tuần",
        "targetLevel": "${progress.currentLevel}",
        "steps": [
          {
            "title": "Tên bước học ${selectedLanguage.name}",
            "description": "Nội dung phù hợp với ${selectedLanguage.name}",
            "lessonType": "grammar|listening",
            "estimatedTime": "30-45 phút",
            "difficulty": "beginner|intermediate|advanced", 
            "xpReward": 15,
            "topics": ["chủ đề ${selectedLanguage.name} 1", "chủ đề 2"]
          }
        ]
      }`;

      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
      }, {
        headers: {
          'x-goog-api-key': this.geminiApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const rawPathData = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawPathData) {
        throw new InternalServerErrorException('Failed to extract path data from Gemini API response.');
      }

      const processedPathData = this.processPathData(rawPathData, preferences, selectedLanguage.code);

      return {
        success: true,
        message: 'Learning path generated for review',
        data: {
          userId: user.id,
          username: user.username,
          language: selectedLanguage.name,
          languageCode: selectedLanguage.code,
          currentProgress: progress,
          pathData: processedPathData,
          quizStructure: this.QUIZ_STRUCTURE,
          isConfirmed: false,
          needsConfirmation: true
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate learning path: ' + error.message);
    }
  }

  // NEW: Get continuation suggestion for existing learners
  private async getContinuationSuggestion(userId: number, language: Language, progress: UserLanguageProgress) {
    // Get user's existing paths and suggest next steps
    const existingPaths = await this.pathRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    const latestPath = existingPaths[0];
    
    return {
      success: true,
      message: 'Continue your learning journey',
      data: {
        userId,
        language: language.name,
        languageCode: language.code,
        currentProgress: progress,
        suggestion: {
          action: 'continue',
          message: `Tiếp tục học ${language.name}. Bạn đã hoàn thành ${progress.completedLessons}/${progress.totalLessons} bài.`,
          nextSteps: [
            'Hoàn thành các bài học còn lại',
            'Làm quiz ôn tập',
            'Nâng cao trình độ với lộ trình mới'
          ]
        },
        existingPath: latestPath,
        needsNewPath: progress.completedLessons >= progress.totalLessons * 0.8
      }
    };
  }

  // UPDATED: Process path data with language context
  private processPathData(rawPathData: string, preferences: string[], languageCode: string): ProcessedPathData {
    try {
      let cleanedData = rawPathData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedData = JSON.parse(cleanedData);
      
      if (!parsedData.title || !parsedData.steps || !Array.isArray(parsedData.steps)) {
        throw new Error('Invalid learning path format');
      }

      const processedSteps: LearningStep[] = parsedData.steps.map((step: any, index: number) => {
        if (!step.title || !step.description || !step.lessonType) {
          throw new Error(`Invalid step format at index ${index}`);
        }

        const validLessonType = ['grammar', 'listening'].includes(step.lessonType) 
          ? step.lessonType 
          : 'grammar';

        return {
          title: step.title.trim(),
          description: step.description.trim(),
          lessonType: validLessonType,
          estimatedTime: step.estimatedTime?.trim() || '30 phút',
          difficulty: step.difficulty || 'beginner',
          xpReward: step.xpReward || 15,
          topics: Array.isArray(step.topics) ? step.topics : []
        };
      });

      return {
        title: parsedData.title.trim(),
        description: parsedData.description?.trim() || '',
        estimatedDuration: parsedData.estimatedDuration?.trim() || '4-6 tuần',
        targetLevel: parsedData.targetLevel || 'beginner',
        steps: processedSteps,
        totalSteps: processedSteps.length,
        preferences: preferences,
        languageCode // Add language context
      };
    } catch (error) {
      console.error('Error processing path data:', error);
      throw new Error(`Failed to process learning path data: ${error.message}`);
    }
  }

  // UPDATED: Confirm and create learning path (rest of the methods remain the same but with language context)
  async confirmAndCreateLearningPath(
    userId: number, 
    pathData: ProcessedPathData,
    courseId: number
  ) {
    try {
      const { user, selectedLanguage } = await this.getUserLanguageContext(userId);
      
      if (!selectedLanguage) {
        throw new Error('User must have a selected language to create learning path.');
      }

      const course = await this.courseRepository.findOne({ 
        where: { id: courseId },
        relations: ['language'] 
      });
      
      if (!course) {
        throw new NotFoundException(`Course with id ${courseId} not found`);
      }

      // Verify course language matches user's selected language
      if (course.languageId !== selectedLanguage.id) {
        throw new Error(`Course language doesn't match user's selected language (${selectedLanguage.name})`);
      }

      const savedPath = await this.saveConfirmedPath(userId, pathData);
      const generatedLessons = await this.generateLessonsFromPath(pathData, courseId, savedPath.id);
      const quizResults = await this.generateStructuredQuizzesForLessons(generatedLessons, selectedLanguage.code);

      return {
        success: true,
        message: 'Complete learning path created successfully',
        data: {
          pathId: savedPath.id,
          userId: user.id,
          courseId: courseId,
          language: selectedLanguage.name,
          languageCode: selectedLanguage.code,
          title: pathData.title,
          totalLessons: generatedLessons.length,
          quizStructure: this.QUIZ_STRUCTURE,
          quizResults: quizResults,
          createdAt: savedPath.createdAt,
          lessons: generatedLessons.map(lesson => {
            const lessonQuizzes = quizResults.lessonResults.find(r => r.lessonId === lesson.id);
            return {
              id: lesson.id,
              title: lesson.title,
              lessonType: lesson.lessonType,
              grammarQuestions: lessonQuizzes?.grammarQuestions || 0,
              listeningQuestions: lessonQuizzes?.listeningQuestions || 0,
              totalQuestions: lessonQuizzes?.totalQuestions || 0
            };
          })
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to create complete learning path: ' + error.message);
    }
  }

  // UPDATED: Generate daily quests with language context
  async generateDailyQuests(date: Date = new Date()) {
    const questDate = date.toISOString().split('T')[0];
    
    const existingQuests = await this.questRepository.find({
      where: { questDate: new Date(questDate) }
    });

    if (existingQuests.length > 0) {
      return { message: 'Quests already generated for today', quests: existingQuests };
    }

    // Generate language-aware quests
    const quests = await Promise.all([
      this.generateQuizCompletionQuest(questDate),
      this.generateCategoryFocusQuest(questDate),
      this.generateAccuracyQuest(questDate),
      this.generateStreakQuest(questDate),
      this.generateLanguageSpecificQuest(questDate) // NEW: Language-specific quest
    ]);

    const savedQuests = await this.questRepository.save(quests.filter(q => q !== null));

    return {
      success: true,
      message: `Generated ${savedQuests.length} AI quests for ${questDate}`,
      quests: savedQuests
    };
  }

  // NEW: Generate language-specific daily quest
private async generateLanguageSpecificQuest(questDate: string): Promise<DailyQuest | null> {
  try {
    const newQuest = this.questRepository.create({
      questDate: new Date(questDate),
      questType: 'language_focus' as any, // Temporary cast until entity is updated
      title: 'Tập trung ngôn ngữ',
      description: 'Hoàn thành 3 câu hỏi trong ngôn ngữ bạn đang học',
      requirementValue: 3,
      questData: { 
        specificRequirements: 'language_specific',
        requiresUserLanguage: true
      } as QuestData,
      xpReward: 40,
      gemReward: 8,
      isAiGenerated: true,
      isActive: true
    });

    return await this.questRepository.save(newQuest);
  } catch (error) {
    console.error('Error generating language-specific quest:', error);
    return null;
  }
}

  // Keep all other existing methods (generateStructuredQuizzesForLessons, updateQuestProgress, etc.)
  // but make sure they use language context when needed...

  // [Rest of the methods remain the same - just adding language context where appropriate]
  
  private async generateStructuredQuizzesForLessons(lessons: Lesson[], languageCode: string) {
    const results = {
      totalQuestions: 0,
      totalLessons: lessons.length,
      lessonResults: [] as Array<{
        lessonId: number;
        lessonTitle: string;
        lessonType: string;
        grammarQuestions: number;
        listeningQuestions: number;
        totalQuestions: number;
        success: boolean;
        error?: string;
      }>
    };

    for (const lesson of lessons) {
      try {
        console.log(`🔄 Generating quizzes for lesson: ${lesson.title} (${lesson.lessonType}) - Language: ${languageCode}`);
        
        const quizCount = await this.generateQuizzesForSingleLesson(lesson, languageCode);
        
        results.lessonResults.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonType: lesson.lessonType,
          grammarQuestions: quizCount.grammarQuestions,
          listeningQuestions: quizCount.listeningQuestions,
          totalQuestions: quizCount.totalQuestions,
          success: true
        });

        results.totalQuestions += quizCount.totalQuestions;
        
      } catch (error) {
        console.error(`❌ Failed to generate quizzes for lesson ${lesson.id}:`, error);
        
        results.lessonResults.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonType: lesson.lessonType,
          grammarQuestions: 0,
          listeningQuestions: 0,
          totalQuestions: 0,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  private async generateQuizzesForSingleLesson(lesson: Lesson, languageCode: string) {
    const counts = {
      grammarQuestions: 0,
      listeningQuestions: 0,
      totalQuestions: 0
    };

    console.log(`📝 Generating grammar questions for lesson: ${lesson.title} - Language: ${languageCode}`);
    
    const grammarBasicMedium = await this.generateQuestionsByCategory(
      lesson, 
      'grammar', 
      'basic',
      this.QUIZ_STRUCTURE.grammar.basicToMedium,
      languageCode
    );
    
    const grammarHard = await this.generateQuestionsByCategory(
      lesson, 
      'grammar', 
      'advanced',
      this.QUIZ_STRUCTURE.grammar.hard,
      languageCode
    );

    counts.grammarQuestions = grammarBasicMedium.length + grammarHard.length;

    console.log(`🎧 Generating listening questions for lesson: ${lesson.title} - Language: ${languageCode}`);
    
    const listeningBasicMedium = await this.generateQuestionsByCategory(
      lesson, 
      'listening', 
      'basic',
      this.QUIZ_STRUCTURE.listening.basicToMedium,
      languageCode
    );
    
    const listeningHard = await this.generateQuestionsByCategory(
      lesson, 
      'listening', 
      'advanced',
      this.QUIZ_STRUCTURE.listening.hard,
      languageCode
    );

    counts.listeningQuestions = listeningBasicMedium.length + listeningHard.length;
    counts.totalQuestions = counts.grammarQuestions + counts.listeningQuestions;

    console.log(`✅ Lesson ${lesson.id} quiz generation complete:`, counts);
    return counts;
  }

  private async generateQuestionsByCategory(
    lesson: Lesson,
    category: 'grammar' | 'listening',
    level: 'basic' | 'advanced',
    count: number,
    languageCode: string
  ): Promise<Question[]> {
    const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
    
    const levelText = level === 'basic' ? 'cơ bản đến trung bình' : 'khó';
    const categoryText = category === 'grammar' ? 'ngữ pháp và cú pháp' : 'nghe hiểu';
    
    // Get language name for better context
    const language = await this.languageRepository.findOne({
      where: { code: languageCode }
    });
    const languageName = language?.name || languageCode;
    
    const prompt = `Tạo ${count} câu hỏi ${categoryText} mức độ ${levelText} cho bài học "${lesson.title}":
    - Ngôn ngữ đích: ${languageName} (${languageCode})
    - Loại bài: ${lesson.lessonType}
    - Nội dung bài học: ${JSON.stringify(lesson.content)}
    - Danh mục: ${category}
    - Cấp độ: ${levelText}
    
    ${category === 'grammar' ? 
      `Tập trung vào ngữ pháp ${languageName}: cấu trúc câu, thì, giới từ, mạo từ, câu điều kiện...` :
      `Tập trung vào nghe hiểu ${languageName}: nghe và chọn đáp án đúng, nghe và điền từ thiếu...`
    }
    
    Tất cả câu hỏi và đáp án phải phù hợp với việc học ${languageName}.
    
    Phân bố loại câu hỏi:
    - 70% multiple_choice
    - 20% translation (${category === 'grammar' ? `dịch câu ${languageName}` : `nghe và viết lại bằng ${languageName}`})
    - 10% matching
    
    QUAN TRỌNG: Chỉ trả về JSON hợp lệ:
    {
      "questions": [
        {
          "questionType": "multiple_choice|translation|matching",
          "questionText": "Câu hỏi chi tiết bằng ${languageName}",
          "questionData": ${category === 'listening' ? '{"audioUrl": "link_to_audio_file", "transcript": "nội dung audio"}' : 'null'},
          "correctAnswer": "đáp án đúng",
          "incorrectAnswers": ["sai 1", "sai 2", "sai 3"],
          "explanation": "giải thích chi tiết tại sao đáp án này đúng",
          "difficulty": ${level === 'basic' ? '1-3' : '4-5'}
        }
      ]
    }`;

    try {
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
      }, {
        headers: {
          'x-goog-api-key': this.geminiApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const rawQuestions = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawQuestions) {
        throw new Error(`Failed to generate ${category} questions`);
      }

      let cleanedData = rawQuestions.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedData = JSON.parse(cleanedData);
      
      if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
        throw new Error('Invalid questions format from AI');
      }

      const questions: Question[] = [];
      
      // Get current question count for sort order
      const existingCount = await this.questionRepository.count({
        where: { lessonId: lesson.id }
      });
      
      for (let i = 0; i < Math.min(parsedData.questions.length, count); i++) {
        const q = parsedData.questions[i];
        
        const question = this.questionRepository.create({
          lessonId: lesson.id,
          questionType: q.questionType || 'multiple_choice',
          questionText: q.questionText || 'Default question',
          questionData: q.questionData || null,
          correctAnswer: q.correctAnswer || 'Default answer',
          incorrectAnswers: q.incorrectAnswers || [],
          explanation: q.explanation || 'No explanation provided',
          difficulty: q.difficulty || (level === 'basic' ? 2 : 4),
          quizLevel: level, // 'basic' or 'advanced'
          quizCategory: category, // 'grammar' or 'listening'
          sortOrder: existingCount + i + 1,
          isActive: true,
        });

        const savedQuestion = await this.questionRepository.save(question);
        questions.push(savedQuestion);
      }

      console.log(`✅ Generated ${questions.length} ${category} (${level}) questions for lesson ${lesson.id} - ${languageName}`);
      return questions;

    } catch (error) {
      console.error(`❌ Error generating ${category} ${level} questions for ${languageName}:`, error);
      return []; // Return empty array on failure
    }
  }

  private async saveConfirmedPath(userId: number, pathData: ProcessedPathData): Promise<AiSuggestedPath> {
    const path = this.pathRepository.create({
      userId: userId,
      pathData: pathData,
    });
    return this.pathRepository.save(path);
  }

  private async generateLessonsFromPath(pathData: ProcessedPathData, courseId: number, pathId: number): Promise<Lesson[]> {
    const lessons: Lesson[] = [];

    for (let i = 0; i < pathData.steps.length; i++) {
      const step = pathData.steps[i];
      
      const lessonContent = await this.generateLessonContent(step, i + 1, pathData.languageCode);
      
      const lesson = this.lessonRepository.create({
        courseId: courseId,
        aiPathId: pathId,
        title: step.title,
        description: step.description,
        lessonType: step.lessonType,
        content: lessonContent,
        xpReward: step.xpReward,
        unlockRequirement: i === 0 ? undefined : { previousLessonId: lessons[i-1]?.id },
        creationSource: 'ai_generated',
        isActive: true,
        sortOrder: i + 1,
      });

      const savedLesson = await this.lessonRepository.save(lesson);
      lessons.push(savedLesson);
    }

    return lessons;
  }

  private async generateLessonContent(step: LearningStep, order: number, languageCode: string): Promise<any> {
    const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
    
    // Get language name for better context
    const language = await this.languageRepository.findOne({
      where: { code: languageCode }
    });
    const languageName = language?.name || languageCode;
    
    const prompt = `Tạo nội dung chi tiết cho bài học "${step.title}":
    - Ngôn ngữ đích: ${languageName} (${languageCode})
    - Loại bài học: ${step.lessonType}
    - Mô tả: ${step.description}
    - Chủ đề: ${step.topics.join(', ')}
    - Độ khó: ${step.difficulty}
    
    Nội dung phải phù hợp với việc học ${languageName} và cấp độ ${step.difficulty}.
    
    QUAN TRỌNG: Chỉ trả về JSON hợp lệ:
    {
      "theory": "Phần lý thuyết chi tiết về ${languageName}",
      "examples": ["ví dụ ${languageName} 1", "ví dụ ${languageName} 2"],
      "vocabulary": [{"word": "từ ${languageName}", "meaning": "nghĩa", "example": "câu ví dụ ${languageName}"}],
      "keyPoints": ["điểm quan trọng 1", "điểm quan trọng 2"],
      "exercises": ["bài tập ${languageName} 1", "bài tập ${languageName} 2"],
      "languageCode": "${languageCode}"
    }`;

    try {
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
      }, {
        headers: {
          'x-goog-api-key': this.geminiApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const rawContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawContent) {
        throw new Error('Failed to generate lesson content');
      }

      let cleanedData = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const content = JSON.parse(cleanedData);
      
      // Ensure language code is included
      content.languageCode = languageCode;
      
      return content;
    } catch (error) {
      console.error('Error generating lesson content:', error);
      return {
        theory: step.description,
        examples: [],
        vocabulary: [],
        keyPoints: step.topics,
        exercises: [],
        languageCode: languageCode
      };
    }
  }

  // Rest of existing methods with language-aware updates...
  // private async generateQuizCompletionQuest(questDate: string): Promise<DailyQuest | null> {
  //   const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
    
  //   const prompt = `Tạo nhiệm vụ hoàn thành quiz cho ngày ${questDate}.
  //   Yêu cầu: Người dùng cần hoàn thành 1-3 bài quiz bất kỳ trong ngôn ngữ họ đang học.
    
  //   Trả về JSON:
  //   {
  //     "title": "Tên nhiệm vụ ngắn gọn",
  //     "description": "Mô tả chi tiết nhiệm vụ",
  //     "requirementValue": 1-3,
  //     "xpReward": 30-100,
  //     "gemReward": 5-15
  //   }`;

  //   try {
  //     const response = await this.callGeminiApi(prompt);
  //     const questData = JSON.parse(response);

  //     return this.questRepository.create({
  //       questDate: new Date(questDate),
  //       questType: 'quiz_complete',
  //       title: questData.title || 'Hoàn thành Quiz',
  //       description: questData.description || 'Hoàn thành ít nhất 1 bài quiz hôm nay',
  //       requirementValue: questData.requirementValue || 1,
  //       questData,
  //       xpReward: questData.xpReward || 50,
  //       gemReward: questData.gemReward || 5,
  //       isAiGenerated: true,
  //       isActive: true
  //     });
  //   } catch (error) {
  //     console.error('Error generating quiz completion quest:', error);
  //     return null;
  //   }
  // }

  private async generateQuizCompletionQuest(questDate: string): Promise<DailyQuest | null> {
  const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
  
  const prompt = `Tạo nhiệm vụ hoàn thành quiz cho ngày ${questDate}.
  Yêu cầu: Người dùng cần hoàn thành 1-3 bài quiz bất kỳ trong ngôn ngữ họ đang học.
  
  Trả về JSON:
  {
    "title": "Tên nhiệm vụ ngắn gọn",
    "description": "Mô tả chi tiết nhiệm vụ", 
    "requirementValue": 2,
    "xpReward": 50,
    "gemReward": 8
  }
  
  LƯU Ý: requirementValue phải là số nguyên từ 1-10, không được vượt quá 10.`;

  try {
    const response = await this.callGeminiApi(prompt);
    const questData = JSON.parse(response);

    // Validate and sanitize the requirement value
    const requirementValue = Math.max(1, Math.min(10, parseInt(questData.requirementValue) || 1));
    const xpReward = Math.max(10, Math.min(200, parseInt(questData.xpReward) || 50));
    const gemReward = Math.max(1, Math.min(50, parseInt(questData.gemReward) || 5));

    return this.questRepository.create({
      questDate: new Date(questDate),
      questType: 'quiz_complete',
      title: questData.title || 'Hoàn thành Quiz',
      description: questData.description || 'Hoàn thành ít nhất 1 bài quiz hôm nay',
      requirementValue: requirementValue,
      questData: {
        specificRequirements: 'quiz_completion'
      },
      xpReward: xpReward,
      gemReward: gemReward,
      isAiGenerated: true,
      isActive: true
    });
  } catch (error) {
    console.error('Error generating quiz completion quest:', error);
    
    // Return a fallback quest if AI generation fails
    return this.questRepository.create({
      questDate: new Date(questDate),
      questType: 'quiz_complete',
      title: 'Hoàn thành Quiz Hàng Ngày',
      description: 'Hoàn thành ít nhất 1 bài quiz để kiểm tra kiến thức',
      requirementValue: 1,
      questData: {
        specificRequirements: 'quiz_completion'
      },
      xpReward: 50,
      gemReward: 5,
      isAiGenerated: false,
      isActive: true
    });
  }
}

  // private async generateCategoryFocusQuest(questDate: string): Promise<DailyQuest | null> {
  //   const categories = ['grammar', 'listening'];
  //   const levels = ['basic', 'advanced'];
  //   const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  //   const randomLevel = levels[Math.floor(Math.random() * levels.length)];

  //   const prompt = `Tạo nhiệm vụ tập trung vào ${randomCategory} cấp độ ${randomLevel} cho ngày ${questDate}.
    
  //   Trả về JSON:
  //   {
  //     "title": "Tên nhiệm vụ hấp dẫn",
  //     "description": "Mô tả chi tiết về việc làm bài ${randomCategory} ${randomLevel}",
  //     "requirementValue": 5-10,
  //     "xpReward": 40-80,
  //     "gemReward": 8-12
  //   }`;

  //   try {
  //     const response = await this.callGeminiApi(prompt);
  //     const questData = JSON.parse(response);

  //     const newQuest = this.questRepository.create({
  //       questDate: new Date(questDate),
  //       questType: 'category_focus',
  //       title: questData.title || `Thành thạo ${randomCategory}`,
  //       description: questData.description || `Hoàn thành 5 câu hỏi ${randomCategory} ${randomLevel}`,
  //       requirementValue: questData.requirementValue || 5,
  //       questData: { 
  //         category: randomCategory as 'grammar' | 'listening',
  //         level: randomLevel as 'basic' | 'advanced',
  //         specificRequirements: 'category_specific'
  //       },
  //       xpReward: questData.xpReward || 60,
  //       gemReward: questData.gemReward || 10,
  //       isAiGenerated: true,
  //       isActive: true
  //     });

  //     return await this.questRepository.save(newQuest);
  //   } catch (error) {
  //     console.error('Error generating category focus quest:', error);
  //     return null;
  //   }
  // }

  private async generateCategoryFocusQuest(questDate: string): Promise<DailyQuest | null> {
  const categories = ['grammar', 'listening'];
  const levels = ['basic', 'advanced'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const randomLevel = levels[Math.floor(Math.random() * levels.length)];

  const prompt = `Tạo nhiệm vụ tập trung vào ${randomCategory} cấp độ ${randomLevel} cho ngày ${questDate}.
  
  Trả về JSON:
  {
    "title": "Tên nhiệm vụ hấp dẫn",
    "description": "Mô tả chi tiết về việc làm bài ${randomCategory} ${randomLevel}",
    "requirementValue": 5,
    "xpReward": 60,
    "gemReward": 10
  }
  
  LƯU Ý: requirementValue phải là số nguyên từ 3-15, không được vượt quá 15.`;

  try {
    const response = await this.callGeminiApi(prompt);
    const questData = JSON.parse(response);

    // Validate and sanitize values
    const requirementValue = Math.max(3, Math.min(15, parseInt(questData.requirementValue) || 5));
    const xpReward = Math.max(20, Math.min(150, parseInt(questData.xpReward) || 60));
    const gemReward = Math.max(3, Math.min(25, parseInt(questData.gemReward) || 10));

    const newQuest = this.questRepository.create({
      questDate: new Date(questDate),
      questType: 'category_focus',
      title: questData.title || `Thành thạo ${randomCategory}`,
      description: questData.description || `Hoàn thành ${requirementValue} câu hỏi ${randomCategory} ${randomLevel}`,
      requirementValue: requirementValue,
      questData: { 
        category: randomCategory as 'grammar' | 'listening',
        level: randomLevel as 'basic' | 'advanced',
        specificRequirements: 'category_specific'
      },
      xpReward: xpReward,
      gemReward: gemReward,
      isAiGenerated: true,
      isActive: true
    });

    return await this.questRepository.save(newQuest);
  } catch (error) {
    console.error('Error generating category focus quest:', error);
    
    // Return fallback quest
    return this.questRepository.create({
      questDate: new Date(questDate),
      questType: 'category_focus',
      title: `Thành thạo ${randomCategory}`,
      description: `Hoàn thành 5 câu hỏi ${randomCategory} ${randomLevel}`,
      requirementValue: 5,
      questData: { 
        category: randomCategory as 'grammar' | 'listening',
        level: randomLevel as 'basic' | 'advanced',
        specificRequirements: 'category_specific'
      },
      xpReward: 60,
      gemReward: 10,
      isAiGenerated: false,
      isActive: true
    });
  }
}

  // private async generateAccuracyQuest(questDate: string): Promise<DailyQuest | null> {
  //   const prompt = `Tạo nhiệm vụ về độ chính xác cho ngày ${questDate}.
  //   Yêu cầu: Đạt độ chính xác 70-90% trong ít nhất 1 bài quiz.
    
  //   Trả về JSON với độ chính xác yêu cầu và phần thưởng hấp dẫn.`;

  //   try {
  //     const response = await this.callGeminiApi(prompt);
  //     const questData = JSON.parse(response);

  //     const newQuest = this.questRepository.create({
  //       questDate: new Date(questDate),
  //       questType: 'accuracy_achieve',
  //       title: questData.title || 'Thử thách độ chính xác',
  //       description: questData.description || 'Đạt độ chính xác 80% trong 1 bài quiz',
  //       requirementValue: questData.requirementValue || 80,
  //       questData: { 
  //         specificRequirements: 'accuracy_challenge'
  //       },
  //       xpReward: questData.xpReward || 70,
  //       gemReward: questData.gemReward || 12,
  //       isAiGenerated: true,
  //       isActive: true
  //     });

  //     return await this.questRepository.save(newQuest);
  //   } catch (error) {
  //     console.error('Error generating accuracy quest:', error);
  //     return null;
  //   }
  // }
  private async generateAccuracyQuest(questDate: string): Promise<DailyQuest | null> {
  const prompt = `Tạo nhiệm vụ về độ chính xác cho ngày ${questDate}.
  Yêu cầu: Đạt độ chính xác 70-90% trong ít nhất 1 bài quiz.
  
  Trả về JSON:
  {
    "title": "Thử thách độ chính xác",
    "description": "Đạt độ chính xác cao trong bài quiz",
    "requirementValue": 80,
    "xpReward": 70,
    "gemReward": 12
  }
  
  LƯU Ý: requirementValue phải là số nguyên từ 70-95 (đại diện cho % chính xác).`;

  try {
    const response = await this.callGeminiApi(prompt);
    const questData = JSON.parse(response);

    // Validate accuracy percentage (70-95)
    const requirementValue = Math.max(70, Math.min(95, parseInt(questData.requirementValue) || 80));
    const xpReward = Math.max(30, Math.min(120, parseInt(questData.xpReward) || 70));
    const gemReward = Math.max(5, Math.min(20, parseInt(questData.gemReward) || 12));

    const newQuest = this.questRepository.create({
      questDate: new Date(questDate),
      questType: 'accuracy_achieve',
      title: questData.title || 'Thử thách độ chính xác',
      description: questData.description || `Đạt độ chính xác ${requirementValue}% trong 1 bài quiz`,
      requirementValue: requirementValue,
      questData: { 
        specificRequirements: 'accuracy_challenge'
      },
      xpReward: xpReward,
      gemReward: gemReward,
      isAiGenerated: true,
      isActive: true
    });

    return await this.questRepository.save(newQuest);
  } catch (error) {
    console.error('Error generating accuracy quest:', error);
    
    // Return fallback quest
    return this.questRepository.create({
      questDate: new Date(questDate),
      questType: 'accuracy_achieve',
      title: 'Thử thách độ chính xác',
      description: 'Đạt độ chính xác 80% trong 1 bài quiz',
      requirementValue: 80,
      questData: { 
        specificRequirements: 'accuracy_challenge'
      },
      xpReward: 70,
      gemReward: 12,
      isAiGenerated: false,
      isActive: true
    });
  }
}

  private async generateStreakQuest(questDate: string): Promise<DailyQuest | null> {
    try {
      const newQuest = this.questRepository.create({
        questDate: new Date(questDate),
        questType: 'streak_maintain',
        title: 'Duy trì streak',
        description: 'Học ít nhất 1 bài để giữ streak hôm nay',
        requirementValue: 1,
        questData: { 
          specificRequirements: 'streak_maintenance'
        },
        xpReward: 25,
        gemReward: 3,
        isAiGenerated: false,
        isActive: true
      });

      return await this.questRepository.save(newQuest);
    } catch (error) {
      console.error('Error generating streak quest:', error);
      return null;
    }
  }

  // Language-aware quest assignment
async assignDailyQuestsToUser(userId: number, questDate: Date = new Date()) {
  const { user, selectedLanguage } = await this.getUserLanguageContext(userId);
  
  const dateString = questDate.toISOString().split('T')[0];
  let todayQuests = await this.questRepository.find({
    where: { questDate: new Date(dateString), isActive: true }
  });

  if (todayQuests.length === 0) {
    await this.generateDailyQuests(questDate);
    todayQuests = await this.questRepository.find({
      where: { questDate: new Date(dateString), isActive: true }
    });
  }

  // Filter quests based on user's language context
  const applicableQuests = todayQuests.filter(quest => {
    const questData = quest.questData as QuestData;
    // If quest requires language context and user has no selected language, skip it
    if (questData?.requiresUserLanguage && !selectedLanguage) {
      return false;
    }
    return true;
  });

  const existingUserQuests = await this.userQuestRepository.find({
    where: { 
      userId,
      dailyQuest: { questDate: new Date(dateString) }
    },
    relations: ['dailyQuest']
  });

  if (existingUserQuests.length > 0) {
    return {
      success: true,
      message: 'User already has quests for today',
      quests: existingUserQuests,
      userLanguage: selectedLanguage?.name || 'Not selected'
    };
  }

  const userQuests = applicableQuests.map(quest => 
    this.userQuestRepository.create({
      userId,
      dailyQuestId: quest.id,
      progressValue: 0,
      isCompleted: false
    })
  );

  const savedUserQuests = await this.userQuestRepository.save(userQuests);

  return {
    success: true,
    message: `Assigned ${savedUserQuests.length} quests to user`,
    quests: savedUserQuests,
    userLanguage: selectedLanguage?.name || 'Not selected'
  };
}

  // Language-aware quest progress update
async updateQuestProgress(userId: number, action: {
  type: 'quiz_completed' | 'question_answered' | 'lesson_completed';
  data: {
    score?: number;
    accuracy?: number;
    category?: 'grammar' | 'listening' | 'vocabulary';
    level?: 'basic' | 'advanced';
    xpEarned?: number;
    languageCode?: string;
  };
}) {
  const { selectedLanguage } = await this.getUserLanguageContext(userId);
  const today = new Date().toISOString().split('T')[0];
  
  const userQuests = await this.userQuestRepository.find({
    where: {
      userId,
      isCompleted: false,
      dailyQuest: { questDate: new Date(today) }
    },
    relations: ['dailyQuest']
  });

  const updatedQuests: UserDailyQuest[] = [];

  for (const userQuest of userQuests) {
    const quest = userQuest.dailyQuest;
    const questData = quest.questData as QuestData;
    let shouldUpdate = false;
    let progressIncrement = 0;

    // Check if quest requires specific language and matches user's action
    const questRequiresLanguage = questData?.requiresUserLanguage;
    const languageMatches = !questRequiresLanguage || 
      (action.data.languageCode === selectedLanguage?.code) ||
      (!action.data.languageCode && selectedLanguage);

    if (!languageMatches) {
      continue;
    }

    // Handle the language_focus quest type properly
    const questType = quest.questType as string;
    
    switch (questType) {
      case 'quiz_complete':
        if (action.type === 'quiz_completed') {
          progressIncrement = 1;
          shouldUpdate = true;
        }
        break;

      case 'category_focus':
        if (action.type === 'question_answered' && 
            action.data.category === questData?.category &&
            action.data.level === questData?.level) {
          progressIncrement = 1;
          shouldUpdate = true;
        }
        break;

      case 'accuracy_achieve':
        if (action.type === 'quiz_completed' && 
            action.data.accuracy !== undefined &&
            action.data.accuracy >= quest.requirementValue) {
          progressIncrement = quest.requirementValue;
          shouldUpdate = true;
        }
        break;

      case 'language_focus':
        if (action.type === 'question_answered' || action.type === 'quiz_completed') {
          progressIncrement = 1;
          shouldUpdate = true;
        }
        break;

      case 'xp_earn':
        if (action.data.xpEarned !== undefined && action.data.xpEarned > 0) {
          progressIncrement = action.data.xpEarned;
          shouldUpdate = true;
        }
        break;
    }

    if (shouldUpdate) {
      userQuest.progressValue += progressIncrement;
      
      if (userQuest.progressValue >= quest.requirementValue) {
        userQuest.isCompleted = true;
        userQuest.completedAt = new Date();
        await this.awardQuestRewards(userId, quest);
      }

      await this.userQuestRepository.save(userQuest);
      updatedQuests.push(userQuest);
    }
  }

  return {
    success: true,
    updatedQuests: updatedQuests.length,
    completedQuests: updatedQuests.filter(q => q.isCompleted).length,
    userLanguage: selectedLanguage?.name || 'Not selected'
  };
}


  private async awardQuestRewards(userId: number, quest: DailyQuest) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    user.totalXp += quest.xpReward;
    user.totalGems += quest.gemReward;

    await this.userRepository.save(user);

    console.log(`✅ User ${userId} completed quest "${quest.title}" and earned ${quest.xpReward} XP + ${quest.gemReward} gems`);
  }

  async getUserDailyQuests(userId: number, date: Date = new Date()) {
    const { selectedLanguage } = await this.getUserLanguageContext(userId);
    const dateString = date.toISOString().split('T')[0];
    
    const userQuests = await this.userQuestRepository.find({
      where: {
        userId,
        dailyQuest: { questDate: new Date(dateString) }
      },
      relations: ['dailyQuest'],
      order: { createdAt: 'ASC' }
    });

    const questsWithProgress = userQuests.map(uq => ({
      id: uq.id,
      questId: uq.dailyQuest.id,
      title: uq.dailyQuest.title,
      description: uq.dailyQuest.description,
      questType: uq.dailyQuest.questType,
      requirementValue: uq.dailyQuest.requirementValue,
      progressValue: uq.progressValue,
      progressPercentage: Math.min(100, (uq.progressValue / uq.dailyQuest.requirementValue) * 100),
      isCompleted: uq.isCompleted,
      completedAt: uq.completedAt,
      xpReward: uq.dailyQuest.xpReward,
      gemReward: uq.dailyQuest.gemReward,
      isAiGenerated: uq.dailyQuest.isAiGenerated,
      requiresLanguage: (uq.dailyQuest.questData as QuestData)?.requiresUserLanguage || false
    }));

    return {
      success: true,
      date: dateString,
      userLanguage: selectedLanguage?.name || 'Not selected',
      totalQuests: questsWithProgress.length,
      completedQuests: questsWithProgress.filter(q => q.isCompleted).length,
      quests: questsWithProgress
    };
  }

  // Additional getter methods with language context
  async getQuiz(quizId: number): Promise<AiGeneratedQuiz> {
    const quiz = await this.quizRepository.findOne({ 
      where: { id: quizId },
      relations: ['user']
    });
    
    if (!quiz) {
      throw new NotFoundException(`Quiz with id ${quizId} not found`);
    }
    
    return quiz;
  }

  async getUserQuizzes(userId: number): Promise<AiGeneratedQuiz[]> {
    return this.quizRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getLearningPath(pathId: number): Promise<AiSuggestedPath> {
    const path = await this.pathRepository.findOne({ 
      where: { id: pathId },
      relations: ['user']
    });
    
    if (!path) {
      throw new NotFoundException(`Learning path with id ${pathId} not found`);
    }
    
    return path;
  }

  async getUserLearningPaths(userId: number): Promise<AiSuggestedPath[]> {
    return this.pathRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  private async callGeminiApi(prompt: string): Promise<string> {
    const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
    
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
    }, {
      headers: {
        'x-goog-api-key': this.geminiApiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const rawResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawResponse) {
      throw new Error('Failed to get response from Gemini API');
    }

    return rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
}