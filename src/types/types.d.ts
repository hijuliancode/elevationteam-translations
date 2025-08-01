export interface ITranslationConfig {
  defaultLanguage: string;
  targetLanguages: string[];
  inputDir: string;
  outputDir: string;
}

export interface ITranslationContent {
  [key: string]: string | ITranslationContent; 
}
