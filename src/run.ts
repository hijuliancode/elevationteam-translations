import fs from 'fs';
import path from 'path';
import { openAIClient } from './translate';
import { TranslationConfig, BaseContent } from '../types/types';

export async function run(config: TranslationConfig): Promise<void> {
  const { defaultLanguage, targetLanguages, inputDir, outputDir, format } = config;

  const baseFilePath = path.join(process.cwd(), inputDir, `${defaultLanguage}.${format}`);

  if (!fs.existsSync(baseFilePath)) {
    console.error(`Base file not found: ${baseFilePath}`);
    process.exit(1);
  }

  try {
    const baseContent: BaseContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));

    for (const language of targetLanguages) {
      if (language === defaultLanguage) continue;

      const targetFilePath = path.join(process.cwd(), outputDir, `${language}.${format}`);
      let existingTranslations: BaseContent = {};

      if (fs.existsSync(targetFilePath)) {
        existingTranslations = JSON.parse(fs.readFileSync(targetFilePath, 'utf-8'));
      }

      const keysToTranslate = Object.entries(baseContent)
        .filter(([key, value]) => !existingTranslations[key] || existingTranslations[key] !== value)
        .map(([key, value]) => ({ key, value }));

      if (keysToTranslate.length > 0) {
        const translations = await Promise.all(
          keysToTranslate.map(({ value }) => openAIClient.translate(value as string, language))
        );

        const updatedTranslations = { ...existingTranslations };
        keysToTranslate.forEach(({ key }, index) => {
          updatedTranslations[key] = translations[index];
        });

        fs.writeFileSync(targetFilePath, JSON.stringify(updatedTranslations, null, 2));
        console.log(`Translation updated for ${language} at ${targetFilePath}`);
      }
    }
  } catch (error) {
    console.error(`Error processing translations: ${(error as Error).message}`);
  }
}
