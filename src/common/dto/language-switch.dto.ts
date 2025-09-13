export class LanguageSwitchDto {
  language_code: string;
}

export class LanguageSwitchResponseDto {
  hasExistingProgress: boolean;
  courseProgress?: any;
  suggestedPath?: any;
  message: string;
}