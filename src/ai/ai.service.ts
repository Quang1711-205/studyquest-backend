// import { Injectable, InternalServerErrorException, UnauthorizedException, NotFoundException } from '@nestjs/common';
// import axios from 'axios';
// import { Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';
// import { ConfigService } from '@nestjs/config';
// import { AiGeneratedQuiz } from './entities/ai-generated-quiz.entity';
// import { AiSuggestedPath } from './entities/ai-suggested-path.entity';
// import { User } from '../users/entities/user.entity';

// @Injectable()
// export class AiService {
//   private readonly geminiApiKey: string;
//   private readonly geminiApiUrl: string;
//   private readonly geminiModel: string;

//   constructor(
//     @InjectRepository(AiGeneratedQuiz)
//     private readonly quizRepository: Repository<AiGeneratedQuiz>,
//     @InjectRepository(AiSuggestedPath)
//     private readonly pathRepository: Repository<AiSuggestedPath>,
//     @InjectRepository(User)
//     private readonly userRepository: Repository<User>,
//     private readonly configService: ConfigService,
//   ) {
//     this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') ?? 'AIzaSyDTrlkXUw98NfswhBE3UG5ZpGXObnxH2no';
//     this.geminiApiUrl = this.configService.get<string>('GEMINI_API_URL') ?? 'https://generativelanguage.googleapis.com/v1beta';
//     this.geminiModel = this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash-lite';
//   }

//   async generateQuiz(userId: number, text: string) {
//     if (!text || text.trim() === '') {
//       throw new Error('Text input cannot be empty.');
//     }

//     if (!userId || userId <= 0) {
//       throw new Error('Valid userId is required.');
//     }

//     try {
//       const user = await this.userRepository.findOne({ where: { id: userId } });
//       if (!user) {
//         throw new NotFoundException(`User with id ${userId} not found`);
//       }

//       const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
//       const response = await axios.post(
//         url,
//         {
//           contents: [
//             {
//               parts: [
//                 { text: `Hãy tạo 3 câu hỏi trắc nghiệm (chỉ trả về câu trả lời dưới dạng JSON chứ không nói gì thêm, trả lời đúng trọng tâm) dựa trên nội dung sau: ${text} (không nói lan man, chỉ trả về câu trả lời dưới dạng JSON để gửi về phía client hiển thị ra màn hình cho người dùng - không cần câu mở hay kết, tôi chỉ quan tâm nội dung bạn trả về). Tạo toàn bộ nội dung bằng JSON từ phản hồi` },
//               ],
//             },
//           ],
//         },
//         {
//           headers: {
//             'x-goog-api-key': this.geminiApiKey,
//             'Content-Type': 'application/json',
//           },
//           timeout: 30000,
//         },
//       );

//       const rawQuizData = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
//       if (!rawQuizData) {
//         throw new InternalServerErrorException('Failed to extract quiz data from Gemini API response.');
//       }

//       const processedQuizData = this.processQuizData(rawQuizData);

//       const quiz = this.quizRepository.create({
//         userId: user.id,
//         quizData: processedQuizData,
//       });
//       const savedQuiz = await this.quizRepository.save(quiz);

//       return {
//         success: true,
//         message: 'Quiz generated successfully',
//         data: {
//           quizId: savedQuiz.id,
//           userId: user.id,
//           username: user.username,
//           createdAt: savedQuiz.createdAt,
//           questionCount: processedQuizData.questions.length,
//         },
//       };
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         const status = error.response?.status;
//         const message = error.response?.data?.error?.message || error.message;

//         if (status === 401) {
//           throw new UnauthorizedException('Gemini API Unauthorized: ' + message);
//         } else if (status === 429) {
//           throw new UnauthorizedException('Gemini API Rate Limited: ' + message);
//         } else if (status === 400) {
//           throw new Error('Invalid request to Gemini API: ' + message);
//         }
//       }
//       throw new InternalServerErrorException('Failed to generate quiz: ' + error.message);
//     }
//   }

//     private processQuizData(rawQuizData: string): { instructions: string; questions: { text: string; options: string[]; answer: string }[] } {
//     const sections = rawQuizData.split('\n\n');
//     const quiz = {
//         instructions: sections[0],
//         questions: [] as { text: string; options: string[]; answer: string }[],
//     };

//     for (let i = 1; i < sections.length; i++) {
//         const questionBlock = sections[i];
//         const lines = questionBlock.split('\n');
//         const question = {
//         text: lines[0],
//         options: lines.slice(1, -1),
//         answer: lines[lines.length - 1],
//         };
//         quiz.questions.push(question);
//     }

//     return quiz;
//     }

//     async suggestLearningPath(userId: number, preferences: string[]) {
//     if (!preferences || preferences.length === 0) {
//         throw new Error('Preferences cannot be empty.');
//     }

//     if (!userId || userId <= 0) {
//         throw new Error('Valid userId is required.');
//     }

//     try {
//         const user = await this.userRepository.findOne({ where: { id: userId } });
//         if (!user) {
//         throw new NotFoundException(`User with id ${userId} not found`);
//         }

//         const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
//         const response = await axios.post(
//         url,
//         {
//             contents: [
//             {
//                 parts: [
//                 {
//                     text: `Người dùng "${user.username}" có sở thích: ${preferences.join(', ')}.\nHãy gợi ý một lộ trình học tập cá nhân hóa.`,
//                 },
//                 ],
//             },
//             ],
//         },
//         {
//             headers: {
//             'x-goog-api-key': this.geminiApiKey,
//             'Content-Type': 'application/json',
//             },
//             timeout: 30000,
//         },
//         );

//         const path = this.pathRepository.create({
//         userId: user.id,
//         pathData: response.data,
//         });
//         const savedPath = await this.pathRepository.save(path);

//         return {
//         success: true,
//         message: 'Learning path generated successfully',
//         data: {
//             pathId: savedPath.id,
//             userId: user.id,
//             username: user.username,
//             preferences,
//             createdAt: savedPath.createdAt,
//         },
//         };
//     } catch (error) {
//         throw new InternalServerErrorException('Failed to generate learning path: ' + error.message);
//     }
//     }
// }

import { Injectable, InternalServerErrorException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiGeneratedQuiz } from './entities/ai-generated-quiz.entity';
import { AiSuggestedPath } from './entities/ai-suggested-path.entity';
import { User } from '../users/entities/user.entity';

// Định nghĩa interfaces cho dữ liệu đã được xử lý
interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface ProcessedQuizData {
  questions: QuizQuestion[];
  totalQuestions: number;
  createdAt: Date;
}

interface LearningStep {
  title: string;
  description: string;
  estimatedTime?: string;
  resources?: string[];
}

interface ProcessedPathData {
  title: string;
  description: string;
  steps: LearningStep[];
  totalSteps: number;
  estimatedDuration?: string;
  preferences: string[];
}

@Injectable()
export class AiService {
  private readonly geminiApiKey: string;
  private readonly geminiApiUrl: string;
  private readonly geminiModel: string;

  constructor(
    @InjectRepository(AiGeneratedQuiz)
    private readonly quizRepository: Repository<AiGeneratedQuiz>,
    @InjectRepository(AiSuggestedPath)
    private readonly pathRepository: Repository<AiSuggestedPath>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') ?? 'AIzaSyDTrlkXUw98NfswhBE3UG5ZpGXObnxH2no';
    this.geminiApiUrl = this.configService.get<string>('GEMINI_API_URL') ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.geminiModel = this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash-lite';
  }

  async generateQuiz(userId: number, text: string) {
    if (!text || text.trim() === '') {
      throw new Error('Text input cannot be empty.');
    }

    if (!userId || userId <= 0) {
      throw new Error('Valid userId is required.');
    }

    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
      
      // Prompt được cải thiện để đảm bảo format JSON chuẩn
      const prompt = `Tạo 3 câu hỏi trắc nghiệm dựa trên nội dung sau: "${text}". 
      QUAN TRỌNG: Chỉ trả về JSON hợp lệ theo định dạng sau, không thêm bất kỳ text nào khác:
      {
        "questions": [
          {
            "question": "Câu hỏi ở đây",
            "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
            "answer": "Đáp án đúng"
          }
        ]
      }`;

      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          headers: {
            'x-goog-api-key': this.geminiApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const rawQuizData = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawQuizData) {
        throw new InternalServerErrorException('Failed to extract quiz data from Gemini API response.');
      }

      // Xử lý và làm sạch dữ liệu trước khi lưu
      const processedQuizData = this.processQuizData(rawQuizData);

      const quiz = this.quizRepository.create({
        userId: user.id,
        quizData: processedQuizData, // Chỉ lưu dữ liệu đã được xử lý
      });
      const savedQuiz = await this.quizRepository.save(quiz);

      return {
        success: true,
        message: 'Quiz generated successfully',
        data: {
          quizId: savedQuiz.id,
          userId: user.id,
          username: user.username,
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

  private processQuizData(rawQuizData: string): ProcessedQuizData {
    try {
      // Loại bỏ markdown code blocks nếu có
      let cleanedData = rawQuizData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Parse JSON
      const parsedData = JSON.parse(cleanedData);
      
      // Validate và extract chỉ những dữ liệu cần thiết
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
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error processing quiz data:', error);
      console.error('Raw data:', rawQuizData);
      throw new Error(`Failed to process quiz data: ${error.message}`);
    }
  }

  async suggestLearningPath(userId: number, preferences: string[]) {
    if (!preferences || preferences.length === 0) {
      throw new Error('Preferences cannot be empty.');
    }

    if (!userId || userId <= 0) {
      throw new Error('Valid userId is required.');
    }

    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      const url = `${this.geminiApiUrl}/models/${this.geminiModel}:generateContent`;
      
      // Prompt cải thiện cho learning path - Thêm detail
      const prompt = `Tạo lộ trình học tập cho người dùng "${user.username}" với sở thích: ${preferences.join(', ')}.
      QUAN TRỌNG: Chỉ trả về JSON hợp lệ theo định dạng sau:
      {
        "title": "Tên lộ trình",
        "description": "Mô tả ngắn gọn về lộ trình",
        "estimatedDuration": "Thời gian ước tính",
        "steps": [
          {
            "title": "Tên bước",
            "description": "Mô tả chi tiết",
            "estimatedTime": "Thời gian ước tính",
            "resources": ["Tài liệu 1", "Tài liệu 2"]
          }
        ]
      }`;

      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          headers: {
            'x-goog-api-key': this.geminiApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const rawPathData = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawPathData) {
        throw new InternalServerErrorException('Failed to extract path data from Gemini API response.');
      }

      // Xử lý và làm sạch dữ liệu
      const processedPathData = this.processPathData(rawPathData, preferences);

      const path = this.pathRepository.create({
        userId: user.id,
        pathData: processedPathData, // Chỉ lưu dữ liệu đã được xử lý
      });
      const savedPath = await this.pathRepository.save(path);

      return {
        success: true,
        message: 'Learning path generated successfully',
        data: {
          pathId: savedPath.id,
          userId: user.id,
          username: user.username,
          title: processedPathData.title,
          description: processedPathData.description,
          steps: processedPathData.steps,
          totalSteps: processedPathData.totalSteps,
          estimatedDuration: processedPathData.estimatedDuration,
          preferences,
          createdAt: savedPath.createdAt,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate learning path: ' + error.message);
    }
  }

  private processPathData(rawPathData: string, preferences: string[]): ProcessedPathData {
    try {
      // Loại bỏ markdown code blocks nếu có
      let cleanedData = rawPathData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Parse JSON
      const parsedData = JSON.parse(cleanedData);
      
      // Validate và extract dữ liệu cần thiết
      if (!parsedData.title || !parsedData.steps || !Array.isArray(parsedData.steps)) {
        throw new Error('Invalid learning path format');
      }

      const processedSteps: LearningStep[] = parsedData.steps.map((step: any, index: number) => {
        if (!step.title || !step.description) {
          throw new Error(`Invalid step format at index ${index}`);
        }

        return {
          title: step.title.trim(),
          description: step.description.trim(),
          estimatedTime: step.estimatedTime?.trim() || undefined,
          resources: Array.isArray(step.resources) 
            ? step.resources.map((r: string) => r.trim()) 
            : undefined
        };
      });

      return {
        title: parsedData.title.trim(),
        description: parsedData.description?.trim() || '',
        estimatedDuration: parsedData.estimatedDuration?.trim() || undefined,
        steps: processedSteps,
        totalSteps: processedSteps.length,
        preferences: preferences
      };
    } catch (error) {
      console.error('Error processing path data:', error);
      console.error('Raw data:', rawPathData);
      throw new Error(`Failed to process learning path data: ${error.message}`);
    }
  }

  // Methods để lấy dữ liệu đã được xử lý
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
}