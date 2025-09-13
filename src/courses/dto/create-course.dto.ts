export class CreateCourseDto {
  languageId: number;
  title: string;
  description?: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  icon?: string;
  colorTheme?: string;
  unlockRequirementXp?: number;
  isActive?: boolean;
  sortOrder?: number;
}