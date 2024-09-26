interface ITranslationConfig {
  defaultLanguage: string;
  targetLanguages: string[];
  inputDir: string;
  outputDir: string;
}

interface ITranslationContent {
  [key: string]: string | ITranslationContent; 
}

export type { ITranslationConfig, ITranslationContent };
