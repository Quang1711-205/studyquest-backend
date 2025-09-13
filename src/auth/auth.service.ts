import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/entities/user.entity';
import { RegisterDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;
    const existing = await this.usersRepository.findOne({ where: [{ email }, { username }] });
    if (existing) throw new ConflictException('Email hoặc username đã tồn tại');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ username, email, passwordHash });
    await this.usersRepository.save(user);
    return { message: 'Đăng ký thành công' };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Sai email hoặc mật khẩu');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Sai email hoặc mật khẩu');

    const payload = { sub: user.id, username: user.username, email: user.email };
    const token = await this.jwtService.signAsync(payload);
    return { access_token: token };
  }
}