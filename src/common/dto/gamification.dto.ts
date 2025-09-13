export class GamificationResponseDto {
  streak: {
    current_streak: number;
    max_streak: number;
    last_activity_date: Date;
  };

  items: {
    item_id: number;
    name: string;
    item_type: string;
    quantity: number;
    purchased_at: Date;
    expires_at?: Date;
  }[];

  dailyQuests: {
    quest_id: number;
    title: string;
    description: string;
    progress_value: number;
    requirement_value: number;
    is_completed: boolean;
    xp_reward: number;
    gem_reward: number;
  }[];
}
