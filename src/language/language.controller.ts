import { Controller, Post, Body, Get } from '@nestjs/common';
import { LanguageService } from './language.service';
import { LanguageSwitchDto } from './dto/languageSwitchDTO';


@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  getLanguages() {
    return this.languageService.getLanguages();
  }

  @Post('switch')
  switchLanguage(@Body() dto: LanguageSwitchDto) {
    return this.languageService.switchLanguage(dto.userId, dto.languageCode);
  }
}