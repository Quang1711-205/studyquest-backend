import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from './entities/language.entity';
import { UserCourseProgress } from 'src/users/entities/UserCourseProgress.entity';
import { Course } from '../courses/entities/course.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { AiService } from '../ai/ai.service';
import { AiSuggestedPath } from 'src/ai/entities/ai-suggested-path.entity';
import { AiGeneratedQuiz } from 'src/ai/entities/ai-generated-quiz.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
    @InjectRepository(UserCourseProgress)
    private readonly progressRepo: Repository<UserCourseProgress>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    private readonly aiService: AiService,
    @InjectRepository(AiSuggestedPath)
    private readonly pathRepository: Repository<AiSuggestedPath>,
    @InjectRepository(AiGeneratedQuiz)
    private readonly quizRepository: Repository<AiGeneratedQuiz>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async switchLanguage(userId: number, languageCode: string) {
    const language = await this.languageRepo.findOne({ where: { code: languageCode } });
    if (!language) throw new NotFoundException('Language not found');

    const progress = await this.progressRepo.findOne({ where: { userId, courseId: language.id } });
    if (progress) return { message: 'Đã có tiến trình', progress };

    // Gọi AI gợi ý lộ trình
    const aiPath : any = await this.aiService.suggestLearningPath(userId, [language.name]);
    // Tạo course và lesson dựa trên lộ trình AI
    const course = await this.courseRepo.save(this.courseRepo.create({
      languageId: language.id,
      title: `Khóa học ${language.name}`,
      description: 'Khóa học tự động từ AI',
      difficultyLevel: 'beginner',
      unlockRequirementXp: 0,
      isActive: true,
    }));
    for (const step of aiPath.steps) {
      await this.lessonRepo.save(this.lessonRepo.create({
        courseId: course.id,
        title: step.step,
        description: step.description,
        lessonType: 'mixed',
        content: step.resources,
        xpReward: 15,
        isActive: true,
      }));
    }
    return { message: 'Đã tạo lộ trình mới', aiPath };
  }
}