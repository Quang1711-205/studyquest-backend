import { Controller, Post, Body } from '@nestjs/common';
import { LanguageService } from './language.service';
import { LanguageSwitchDto } from './dto/languageSwitchDTO';

@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Post('switch')
  switchLanguage(@Body() dto: LanguageSwitchDto) {
    return this.languageService.switchLanguage(dto.userId, dto.languageCode);
  }
}