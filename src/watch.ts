import fs from 'fs';
import path from 'path';
import { translate } from './translate';

export async function watch(config: any) {
  const { baseLocale, locales, inputDir, outputDir, format } = config;

  const baseFilePath = path.join(process.cwd(), inputDir, `${baseLocale}.${format}`);

  // Check if base file exists before starting watch
  if (!fs.existsSync(baseFilePath)) {
    console.error(`Base file not found: ${baseFilePath}`);
    return;
  }

  // Watch for changes in the base file
  fs.watch(baseFilePath, async (eventType) => {
    if (eventType === 'change') {
      console.log(`Changes detected in ${baseFilePath}`);

      try {
        const baseContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));

        // Loop through all target locales except the base locale
        for (const locale of locales) {
          if (locale === baseLocale) continue;

          const targetFilePath = path.join(process.cwd(), outputDir, `${locale}.${format}`);

          // Load existing translation file if it exists
          let existingTranslations: { [key: string]: string } = {};
          if (fs.existsSync(targetFilePath)) {
            existingTranslations = JSON.parse(fs.readFileSync(targetFilePath, 'utf-8'));
          }

          // Create a new object to hold updated translations
          const updatedTranslations: { [key: string]: string } = { ...existingTranslations };

          // Translate each entry from the base file, updating only changed or new keys
          for (const [key, value] of Object.entries(baseContent)) {
            // Only update if the key doesn't exist or the translation is outdated
            if (!existingTranslations[key] || existingTranslations[key] !== value) {
              updatedTranslations[key] = await translate(value as string, locale);
            }
          }

          // Write updated content back to the file
          fs.writeFileSync(targetFilePath, JSON.stringify(updatedTranslations, null, 2));
          console.log(`Translation updated for ${locale} at ${targetFilePath}`);
        }
      } catch (error) {
        console.error(`Error processing translations: ${(error as Error).message}`);
      }
    }
  });

  console.log(`Watching for changes in ${baseFilePath}`);
}
