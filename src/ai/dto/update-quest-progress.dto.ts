import { IsNotEmpty, IsObject, IsEnum, IsOptional, IsNumber } from 'class-validator';

enum ActionType {
  QUIZ_COMPLETED = 'quiz_completed',
  QUESTION_ANSWERED = 'question_answered',
  LESSON_COMPLETED = 'lesson_completed'
}

enum CategoryType {
  GRAMMAR = 'grammar',
  LISTENING = 'listening',
  VOCABULARY = 'vocabulary'
}

enum LevelType {
  BASIC = 'basic',
  ADVANCED = 'advanced'
}

class ActionData {
  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsEnum(CategoryType)
  category?: CategoryType;

  @IsOptional()
  @IsEnum(LevelType)
  level?: LevelType;

  @IsOptional()
  @IsNumber()
  xpEarned?: number;
}

class QuestAction {
  @IsNotEmpty()
  @IsEnum(ActionType)
  type: ActionType;

  @IsNotEmpty()
  @IsObject()
  data: ActionData;
}

export class UpdateQuestProgressDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsObject()
  action: QuestAction;
}
