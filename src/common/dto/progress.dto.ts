export class ProgressResponseDto {
  courseProgress: {
    course_id: number;
    course_title: string;
    lessons_completed: number;
    total_lessons: number;
    progress_percentage: number;
    current_xp: number;
    accuracy_percentage: number;
  }[];
  
  userStats: {
    total_xp: number;
    current_level: number;
    current_streak: number;
    max_streak: number;
    lessons_completed_today: number;
    study_time_today: number;
  };

  recentActivity: {
    lesson_id: number;
    lesson_title: string;
    completed_at: Date;
    score: number;
    xp_earned: number;
  }[];
}