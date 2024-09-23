export interface TranslationConfig {
  defaultLanguage: string;
  targetLanguages: string[];
  inputDir: string;
  outputDir: string;
  format: string;
  aiProvider: string;
}

export interface BaseContent {
  [key: string]: string | BaseContent; 
}

