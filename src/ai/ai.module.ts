import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiGeneratedQuiz } from './entities/ai-generated-quiz.entity';
import { AiSuggestedPath } from './entities/ai-suggested-path.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiGeneratedQuiz, AiSuggestedPath, User])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}