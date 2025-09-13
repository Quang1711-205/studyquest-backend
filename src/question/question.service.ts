import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Question } from './entities/question.entity';
import { CreateQuestionDto } from './dto/createQuestionDTO';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Course } from '../courses/entities/course.entity';
import { QuizCategory, QuizLevel } from './dto/createQuestionDTO';

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

  async create(createQuestionDto: CreateQuestionDto) {
    const question = this.questionRepo.create(createQuestionDto);
    return this.questionRepo.save(question);
  }

async findByLanguage(
  languageId: number, 
  quizCategory: QuizCategory,  // ✅ Dùng enum type
  quizLevel: QuizLevel
) {

  const courses = await this.courseRepo.find({ where: { languageId } });
  const courseIds = courses.map(c => c.id);

  if (courseIds.length === 0) return [];

  const lessons = await this.lessonRepo.find({ where: { courseId: In(courseIds) } });
  const lessonIds = lessons.map(l => l.id);

  if (lessonIds.length === 0) return []; 


  return this.questionRepo.find({
    where: {
      lessonId: In(lessonIds.length > 0 ? lessonIds : [0]),    
      quizCategory,               
      quizLevel,              
      isActive: true,        
    },
  });
}

  async findAll() {
    return this.questionRepo.find();
  }
}