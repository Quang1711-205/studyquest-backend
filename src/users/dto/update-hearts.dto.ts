import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';

export class UpdateHeartsDto {
  /**
   * Reported number of hearts from client.
   * Server sẽ chỉ chấp nhận nếu reportedHearts < current hearts (tức client báo giảm),
   * để tránh client tăng hearts trái phép.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  reportedHearts?: number;

  /**
   * Action thay vì reported số (tùy client). 
   * - 'decrement': giảm hearts theo amount (mặc định 1)
   * - 'set': cố gắng set reportedHearts (chỉ chấp nhận nếu reported < current)
   */
  @IsOptional()
  @IsEnum(['decrement', 'set'])
  action?: 'decrement' | 'set';

  /**
   * Amount cho action=decrement
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}
