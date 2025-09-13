import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Admin thêm khóa học
  @Post("add")
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  // Lấy danh sách khóa học theo ngôn ngữ
  @Get()
  async getCoursesByLanguage(@Query('languageId') languageId: number) {
    return this.coursesService.findAllByLanguage(Number(languageId));
  }
}