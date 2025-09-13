import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {}
// filepath: src/auth/dto/update-auth.dto.ts
export class LoginDto {
  email: string;
  password: string;
}
