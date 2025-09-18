import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Question } from './entities/question.entity';
import { CreateQuestionDto } from './dto/createQuestionDTO';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Course } from '../courses/entities/course.entity';
import { QuizCategory, QuizLevel } from './dto/createQuestionDTO';
import { GetQuestionsDto } from './dto/GetQuestionsDto';
import { QuestionResponseDto } from './dto/QuestionResponseDto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  // NEW METHOD: Lấy questions chỉ từ courseId (courseId -> lessons -> questions)
  async getQuestionsByCourseId(
    courseId: number,
    options?: {
      quizCategory?: 'vocabulary' | 'grammar' | 'listening';
      quizLevel?: 'basic' | 'advanced';
      questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching';
      difficulty?: number;
      onlyActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    questions: Question[];
    total: number;
    courseInfo: {
      id: number;
      title: string;
      languageId: number;
      languageName: string;
      difficultyLevel: string;
    };
    lessonsInfo: Array<{
      id: number;
      title: string;
      questionCount: number;
    }>;
    hasMore: boolean;
  }> {
    // Step 1: Validate và lấy thông tin course
    const course = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.language', 'language')
      .where('course.id = :courseId', { courseId })
      .getOne();

    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    // Step 2: Lấy lessons từ courseId
    const lessonsQuery = this.lessonRepo
      .createQueryBuilder('lesson')
      .where('lesson.courseId = :courseId', { courseId });

    if (options?.onlyActive !== false) {
      lessonsQuery.andWhere('lesson.isActive = :isActive', { isActive: true });
    }

    const lessons = await lessonsQuery
      .orderBy('lesson.sortOrder', 'ASC')
      .getMany();

    if (lessons.length === 0) {
      return {
        questions: [],
        total: 0,
        courseInfo: {
          id: course.id,
          title: course.title,
          languageId: course.languageId,
          languageName: course.language.name,
          difficultyLevel: course.difficultyLevel,
        },
        lessonsInfo: [],
        hasMore: false,
      };
    }

    const lessonIds = lessons.map(lesson => lesson.id);

    // Step 3: Build query để lấy questions từ lessonIds
    const questionQuery = this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.lesson', 'lesson')
      .where('question.lessonId IN (:...lessonIds)', { lessonIds });

    // Apply filters
    if (options?.quizCategory) {
      questionQuery.andWhere('question.quizCategory = :quizCategory', { 
        quizCategory: options.quizCategory 
      });
    }

    if (options?.quizLevel) {
      questionQuery.andWhere('question.quizLevel = :quizLevel', { 
        quizLevel: options.quizLevel 
      });
    }

    if (options?.questionType) {
      questionQuery.andWhere('question.questionType = :questionType', { 
        questionType: options.questionType 
      });
    }

    if (options?.difficulty) {
      questionQuery.andWhere('question.difficulty = :difficulty', { 
        difficulty: options.difficulty 
      });
    }

    if (options?.onlyActive !== false) {
      questionQuery.andWhere('question.isActive = :isActive', { isActive: true });
    }

    // Order by lesson và question
    questionQuery
      .orderBy('lesson.sortOrder', 'ASC')
      .addOrderBy('question.sortOrder', 'ASC')
      .addOrderBy('question.id', 'ASC');

    // Get total count
    const total = await questionQuery.getCount();

    // Apply pagination
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;
    
    questionQuery.skip(offset).take(limit);

    const questions = await questionQuery.getMany();

    // Step 4: Tính question count cho mỗi lesson
    const lessonsInfo = await Promise.all(
      lessons.map(async (lesson) => {
        const questionCount = await this.questionRepo
          .createQueryBuilder('question')
          .where('question.lessonId = :lessonId', { lessonId: lesson.id })
          .andWhere('question.isActive = :isActive', { isActive: true })
          .getCount();

        return {
          id: lesson.id,
          title: lesson.title,
          questionCount,
        };
      })
    );

    return {
      questions,
      total,
      courseInfo: {
        id: course.id,
        title: course.title,
        languageId: course.languageId,
        languageName: course.language.name,
        difficultyLevel: course.difficultyLevel,
      },
      lessonsInfo,
      hasMore: offset + limit < total,
    };
  }

  // NEW METHOD: Simplified version - chỉ lấy questions từ courseId
  async getQuestionsByCourseIdSimple(
    courseId: number,
    options?: {
      quizCategory?: 'vocabulary' | 'grammar' | 'listening';
      quizLevel?: 'basic' | 'advanced';
      questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching';
      onlyActive?: boolean;
    }
  ): Promise<Question[]> {
    // Step 1: Lấy lessonIds từ courseId
    const lessonIds = await this.lessonRepo
      .createQueryBuilder('lesson')
      .select('lesson.id')
      .where('lesson.courseId = :courseId', { courseId })
      .andWhere('lesson.isActive = :isActive', { isActive: options?.onlyActive !== false })
      .getMany()
      .then(lessons => lessons.map(l => l.id));

    if (lessonIds.length === 0) {
      return [];
    }

    // Step 2: Lấy questions từ lessonIds
    const questionQuery = this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.lesson', 'lesson')
      .where('question.lessonId IN (:...lessonIds)', { lessonIds });

    // Apply filters
    if (options?.quizCategory) {
      questionQuery.andWhere('question.quizCategory = :quizCategory', { 
        quizCategory: options.quizCategory 
      });
    }

    if (options?.quizLevel) {
      questionQuery.andWhere('question.quizLevel = :quizLevel', { 
        quizLevel: options.quizLevel 
      });
    }

    if (options?.questionType) {
      questionQuery.andWhere('question.questionType = :questionType', { 
        questionType: options.questionType 
      });
    }

    if (options?.onlyActive !== false) {
      questionQuery.andWhere('question.isActive = :isActive', { isActive: true });
    }

    return questionQuery
      .orderBy('lesson.sortOrder', 'ASC')
      .addOrderBy('question.sortOrder', 'ASC')
      .getMany();
  }

  // Existing methods remain unchanged...

  // 1. Lấy questions từ courseId và languageId
  async getQuestionsByCourseAndLanguage(
    courseId: number,
    languageId: number,
    options?: {
      quizCategory?: 'vocabulary' | 'grammar' | 'listening';
      quizLevel?: 'basic' | 'advanced';
      questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching';
      difficulty?: number;
      onlyActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    questions: Question[];
    total: number;
    courseInfo: {
      id: number;
      title: string;
      languageId: number;
      languageName: string;
    };
    lessonsCount: number;
    hasMore: boolean;
  }> {
    // Validate course và language tồn tại
    const course = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.language', 'language')
      .where('course.id = :courseId', { courseId })
      .andWhere('course.languageId = :languageId', { languageId })
      .getOne();

    if (!course) {
      throw new Error(`Course ${courseId} with language ${languageId} not found`);
    }

    // Build query để lấy questions
    const queryBuilder = this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.lesson', 'lesson')
      .leftJoinAndSelect('lesson.course', 'course')
      .leftJoinAndSelect('course.language', 'language')
      .where('course.id = :courseId', { courseId })
      .andWhere('course.languageId = :languageId', { languageId });

    // Apply filters
    if (options?.quizCategory) {
      queryBuilder.andWhere('question.quizCategory = :quizCategory', { 
        quizCategory: options.quizCategory 
      });
    }

    if (options?.quizLevel) {
      queryBuilder.andWhere('question.quizLevel = :quizLevel', { 
        quizLevel: options.quizLevel 
      });
    }

    if (options?.questionType) {
      queryBuilder.andWhere('question.questionType = :questionType', { 
        questionType: options.questionType 
      });
    }

    if (options?.difficulty) {
      queryBuilder.andWhere('question.difficulty = :difficulty', { 
        difficulty: options.difficulty 
      });
    }

    // Filter active items (default true)
    if (options?.onlyActive !== false) {
      queryBuilder
        .andWhere('question.isActive = :isActive', { isActive: true })
        .andWhere('lesson.isActive = :isActive', { isActive: true })
        .andWhere('course.isActive = :isActive', { isActive: true });
    }

    // Order by lesson và question
    queryBuilder
      .orderBy('lesson.sortOrder', 'ASC')
      .addOrderBy('question.sortOrder', 'ASC')
      .addOrderBy('question.id', 'ASC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;
    
    queryBuilder.skip(offset).take(limit);

    const questions = await queryBuilder.getMany();

    // Count lessons
    const lessonsCount = await this.lessonRepo
      .createQueryBuilder('lesson')
      .leftJoin('lesson.course', 'course')
      .where('course.id = :courseId', { courseId })
      .andWhere('course.languageId = :languageId', { languageId })
      .andWhere('lesson.isActive = :isActive', { isActive: true })
      .getCount();

    return {
      questions,
      total,
      courseInfo: {
        id: course.id,
        title: course.title,
        languageId: course.languageId,
        languageName: course.language.name,
      },
      lessonsCount,
      hasMore: offset + limit < total,
    };
  }

  // 2. Lấy questions từ lessonIds
  async getQuestionsByLessonIds(
    lessonIds: number[],
    options?: {
      quizCategory?: 'vocabulary' | 'grammar' | 'listening';
      quizLevel?: 'basic' | 'advanced';
      questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching';
      onlyActive?: boolean;
    }
  ): Promise<{
    questions: Question[];
    lessonsInfo: Array<{
      id: number;
      title: string;
      courseId: number;
      questionCount: number;
    }>;
  }> {
    if (lessonIds.length === 0) {
      return { questions: [], lessonsInfo: [] };
    }

    const queryBuilder = this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.lesson', 'lesson')
      .where('question.lessonId IN (:...lessonIds)', { lessonIds });

    // Apply filters
    if (options?.quizCategory) {
      queryBuilder.andWhere('question.quizCategory = :quizCategory', { 
        quizCategory: options.quizCategory 
      });
    }

    if (options?.quizLevel) {
      queryBuilder.andWhere('question.quizLevel = :quizLevel', { 
        quizLevel: options.quizLevel 
      });
    }

    if (options?.questionType) {
      queryBuilder.andWhere('question.questionType = :questionType', { 
        questionType: options.questionType 
      });
    }

    if (options?.onlyActive !== false) {
      queryBuilder
        .andWhere('question.isActive = :isActive', { isActive: true })
        .andWhere('lesson.isActive = :isActive', { isActive: true });
    }

    queryBuilder
      .orderBy('lesson.sortOrder', 'ASC')
      .addOrderBy('question.sortOrder', 'ASC');

    const questions = await queryBuilder.getMany();

    // Get lessons info với question count
    const lessonsInfo = await this.lessonRepo
      .createQueryBuilder('lesson')
      .leftJoin('lesson.questions', 'question', 'question.isActive = :isActive')
      .select([
        'lesson.id as id',
        'lesson.title as title', 
        'lesson.courseId as courseId',
        'COUNT(question.id) as questionCount'
      ])
      .where('lesson.id IN (:...lessonIds)', { lessonIds })
      .groupBy('lesson.id, lesson.title, lesson.courseId')
      .setParameters({ isActive: true })
      .getRawMany();

    const transformedLessonsInfo = lessonsInfo.map(lesson => ({
      id: parseInt(lesson.id),
      title: lesson.title,
      courseId: parseInt(lesson.courseId),
      questionCount: parseInt(lesson.questionCount) || 0,
    }));

    return {
      questions,
      lessonsInfo: transformedLessonsInfo,
    };
  }

  // 3. Lấy lessons từ courseId và languageId (helper method)
  async getLessonsByCourseAndLanguage(
    courseId: number,
    languageId: number,
    onlyActive: boolean = true
  ): Promise<Lesson[]> {
    const queryBuilder = this.lessonRepo
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.course', 'course')
      .where('course.id = :courseId', { courseId })
      .andWhere('course.languageId = :languageId', { languageId });

    if (onlyActive) {
      queryBuilder
        .andWhere('lesson.isActive = :isActive', { isActive: true })
        .andWhere('course.isActive = :isActive', { isActive: true });
    }

    queryBuilder.orderBy('lesson.sortOrder', 'ASC');

    return queryBuilder.getMany();
  }

  // 4. Shortcut method - từ courseId + languageId → lessonIds → questions
  async getQuestionsFlowByCourseLanguage(
    courseId: number,
    languageId: number,
    questionFilters?: {
      quizCategory?: 'vocabulary' | 'grammar' | 'listening';
      quizLevel?: 'basic' | 'advanced';
      questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching';
    }
  ): Promise<{
    questions: Question[];
    flow: {
      courseId: number;
      languageId: number;
      lessonIds: number[];
      totalLessons: number;
      totalQuestions: number;
    };
  }> {
    // Step 1: Get lessons từ courseId + languageId
    const lessons = await this.getLessonsByCourseAndLanguage(courseId, languageId);
    const lessonIds = lessons.map(lesson => lesson.id);

    // Step 2: Get questions từ lessonIds
    const result = await this.getQuestionsByLessonIds(lessonIds, questionFilters);

    return {
      questions: result.questions,
      flow: {
        courseId,
        languageId,
        lessonIds,
        totalLessons: lessons.length,
        totalQuestions: result.questions.length,
      },
    };
  }

  // NEW METHOD: Lấy lessons chỉ từ courseId (helper method)
async getLessonsByCourseId(
  courseId: number,
  onlyActive: boolean = true
): Promise<Lesson[]> {
  const queryBuilder = this.lessonRepo
    .createQueryBuilder('lesson')
    .leftJoinAndSelect('lesson.course', 'course')
    .where('lesson.courseId = :courseId', { courseId });

  if (onlyActive) {
    queryBuilder
      .andWhere('lesson.isActive = :isActive', { isActive: true })
      .andWhere('course.isActive = :isActive', { isActive: true });
  }

  queryBuilder.orderBy('lesson.sortOrder', 'ASC');

  return queryBuilder.getMany();
}

// NEW METHOD: Lấy tất cả questions với filters và pagination
async getAllQuestions(options?: {
  quizCategory?: 'vocabulary' | 'grammar' | 'listening';
  quizLevel?: 'basic' | 'advanced';
  questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching';
  difficulty?: number;
  onlyActive?: boolean;
  limit?: number;
  offset?: number;
  search?: string; // tìm kiếm theo question_text
}): Promise<{
  questions: Question[];
  total: number;
  hasMore: boolean;
}> {
  const queryBuilder = this.questionRepo
    .createQueryBuilder('question')
    .leftJoinAndSelect('question.lesson', 'lesson')
    .leftJoinAndSelect('lesson.course', 'course')
    .leftJoinAndSelect('course.language', 'language');

  // Apply filters
  if (options?.quizCategory) {
    queryBuilder.andWhere('question.quizCategory = :quizCategory', { 
      quizCategory: options.quizCategory 
    });
  }

  if (options?.quizLevel) {
    queryBuilder.andWhere('question.quizLevel = :quizLevel', { 
      quizLevel: options.quizLevel 
    });
  }

  if (options?.questionType) {
    queryBuilder.andWhere('question.questionType = :questionType', { 
      questionType: options.questionType 
    });
  }

  if (options?.difficulty) {
    queryBuilder.andWhere('question.difficulty = :difficulty', { 
      difficulty: options.difficulty 
    });
  }

  if (options?.search) {
    queryBuilder.andWhere('question.questionText ILIKE :search', { 
      search: `%${options.search}%` 
    });
  }

  // Filter active items (default true)
  if (options?.onlyActive !== false) {
    queryBuilder.andWhere('question.isActive = :isActive', { isActive: true });
  }

  // Order by newest first, or by your preferred order
  queryBuilder
    .orderBy('question.createdAt', 'DESC')
    .addOrderBy('question.id', 'DESC');

  // Get total count
  const total = await queryBuilder.getCount();

  // Apply pagination
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  
  queryBuilder.skip(offset).take(limit);

  const questions = await queryBuilder.getMany();

  return {
    questions,
    total,
    hasMore: offset + limit < total,
  };
}

// ALTERNATIVE: Simplified version - chỉ lấy questions không có relations
async getAllQuestionsSimple(options?: {
  quizCategory?: 'vocabulary' | 'grammar' | 'listening';
  quizLevel?: 'basic' | 'advanced';
  questionType?: 'multiple_choice' | 'translation' | 'audio' | 'matching';
  onlyActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Question[]> {
  const queryBuilder = this.questionRepo.createQueryBuilder('question');

  // Apply filters
  if (options?.quizCategory) {
    queryBuilder.andWhere('question.quizCategory = :quizCategory', { 
      quizCategory: options.quizCategory 
    });
  }

  if (options?.quizLevel) {
    queryBuilder.andWhere('question.quizLevel = :quizLevel', { 
      quizLevel: options.quizLevel 
    });
  }

  if (options?.questionType) {
    queryBuilder.andWhere('question.questionType = :questionType', { 
      questionType: options.questionType 
    });
  }

  if (options?.onlyActive !== false) {
    queryBuilder.andWhere('question.isActive = :isActive', { isActive: true });
  }

  // Apply pagination
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  
  queryBuilder
    .skip(offset)
    .take(limit)
    .orderBy('question.id', 'ASC');

  return queryBuilder.getMany();
}
// Method đơn giản nhất - lấy tất cả questions
async getAllQuestionsRaw(): Promise<Question[]> {
  return this.questionRepo.find();
}

// Với relations nếu cần
async getAllQuestionsWithRelations(): Promise<Question[]> {
  return this.questionRepo.find({
    relations: ['lesson', 'lesson.course', 'lesson.course.language']
  });
}

// Với limit để tránh quá nhiều data
async getAllQuestionsLimit(limit: number = 50): Promise<Question[]> {
  return this.questionRepo.find({
    take: limit,
    order: { id: 'ASC' }
  });
}
// Method test với raw query
async testRawQuery(page: number = 1): Promise<any> {
  const limit = 50;
  const offset = (page - 1) * limit;

  const result = await this.questionRepo.query(`
    SELECT id, lesson_id, question_type, question_text, 
           correct_answer, incorrect_answers, explanation
    FROM questions 
    WHERE question_type = 'multiple_choice'
    LIMIT ${limit} OFFSET ${offset};
  `);

  console.log(`Raw query result for page ${page}:`, result);
  return result;
}

}