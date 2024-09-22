export interface TranslationConfig {
  defaultLanguage: string;
  languages: string[];
  inputDir: string;
  outputDir: string;
  format: string;
  aiProvider: string;
}

export interface BaseContent {
  [key: string]: string;
}
