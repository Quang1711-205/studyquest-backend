import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { UserCourseProgress } from 'src/users/entities/UserCourseProgress.entity';
import { UserLessonProgress } from 'src/users/entities/UserLessonProgress.entity';
import { UserStats } from 'src/users/entities/UserStats.entity';

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(UserCourseProgress)
    private readonly courseProgressRepo: Repository<UserCourseProgress>,
    @InjectRepository(UserLessonProgress)
    private readonly lessonProgressRepo: Repository<UserLessonProgress>,
    @InjectRepository(UserStats)
    private readonly statsRepo: Repository<UserStats>,
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
  ) {}

  async completeQuiz(userId: number, quizId: number, score: number) {
    // Kiểm tra dữ liệu đầu vào
    if (!userId || !quizId || score === undefined) {
      throw new BadRequestException('userId, quizId, and score are required.');
    }

    // Tìm user từ cơ sở dữ liệu
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Cập nhật XP cho user
    user.totalXp += score;
    await this.userRepository.save(user);

    // Tạo bản ghi quiz attempt
    const quizAttempt = this.quizAttemptRepository.create({
      user, // Truyền đối tượng user thay vì userId
      lessonId: quizId,
      score,
      xpEarned: score,
    });
    await this.quizAttemptRepository.save(quizAttempt);

    return { message: 'Quiz completed', xp: user.totalXp, attempt: quizAttempt };
  }

  async completeFlashcard(userId: number, flashcardId: number) {
    // Kiểm tra dữ liệu đầu vào
    if (!userId || !flashcardId) {
      throw new BadRequestException('userId and flashcardId are required.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Cập nhật XP
    user.totalXp += 10; // Example XP for flashcard
    await this.userRepository.save(user);

    return { message: 'Flashcard completed', xp: user.totalXp };
  }

  async getUserXP(userId: number) {
    if (!userId) {
      throw new BadRequestException('userId is required.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return { userId, xp: user.totalXp };
  }

  async getCourseProgress(userId: number, courseId: number) {
    const progress = await this.courseProgressRepo.findOne({ where: { userId, courseId } });
    if (!progress) throw new NotFoundException('No progress found');
    return progress;
  }

  async getLessonProgress(userId: number, lessonId: number) {
    const progress = await this.lessonProgressRepo.findOne({ where: { userId, lessonId } });
    if (!progress) throw new NotFoundException('No lesson progress found');
    return progress;
  }

  async getDailyStats(userId: number, date: string) {
    const stats = await this.statsRepo.findOne({ where: { userId, statDate: date } });
    if (!stats) throw new NotFoundException('No stats found');
    return stats;
  }

  async getLearningHistory(userId: number) {
    const lessons = await this.lessonProgressRepo.find({ where: { userId, status: 'completed' }, order: { completedAt: 'DESC' } });
    const quizzes = await this.quizAttemptRepository.find({ where: { userId }, order: { completedAt: 'DESC' } });
    return {
      completedLessons: lessons,
      quizAttempts: quizzes,
    };
  }
}