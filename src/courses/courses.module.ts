import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Language } from 'src/language/entities/language.entity';    
@Module({
  imports: [TypeOrmModule.forFeature([Course, Language])],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
