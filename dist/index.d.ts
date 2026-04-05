type IProviderConfig =
  | {
      type: 'openai';
      apiKey: string;
      model: string; // e.g. 'gpt-4o-mini', 'gpt-3.5-turbo'
    }
  | {
      type: 'anthropic';
      apiKey: string;
      model: string; // e.g. 'claude-haiku-4-5-20251001', 'claude-sonnet-4-6'
    }
  | {
      type: 'ollama';
      baseUrl: string; // e.g. 'http://localhost:11434'
      model: string;   // e.g. 'llama3.2', 'gemma2'
    };

interface ITranslationConfig {
  defaultLanguage: string;
  targetLanguages: string[];
  inputDir: string;
  outputDir: string;
  provider: IProviderConfig;
  cacheEnabled?: boolean; // default: true
}

interface ITranslationContent {
  [key: string]: string | ITranslationContent;
}

interface ISnapshotEntry {
  value: string;
  hash: string;
}

interface ISnapshot {
  version: 1;
  baseLanguage: string;
  createdAt: string;
  entries: Record<string, ISnapshotEntry>;
}

interface IDiffResult {
  added: Record<string, string>;
  modified: Record<string, string>;
  deleted: string[];
  unchanged: Record<string, string>;
}

export type { IDiffResult, IProviderConfig, ISnapshot, ISnapshotEntry, ITranslationConfig, ITranslationContent };
