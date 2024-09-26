import path from 'path'
import fs from 'fs'
import { ITranslationContent, ITranslationConfig } from './types/types'
import { translateContent } from './translate'

// Define the path to the configuration file
export const configPath = path.join(process.cwd(), 'translations.config.js')

export async function loadConfig(): Promise<ITranslationConfig> {
  try {
    // Ensure the config file exists
    if (!fs.existsSync(configPath)) {
      console.log('Error: translations.config.js not found.')
      process.exit(1)
    }
    // Loading and returning the configuration
    return (await import(configPath)).translationConfig

  } catch (error) {
    console.error('Error loading configuration: ', (error as Error).message)
    process.exit(1)
  }
}

export async function processTranslations(config: ITranslationConfig): Promise<void> {
  const { defaultLanguage, targetLanguages, inputDir, outputDir } = config
  const baseFilePath = path.join(process.cwd(), inputDir, `${defaultLanguage}.json`)

  if (!fs.existsSync(baseFilePath)) {
    console.error(`Error: Base translation file not found at ${baseFilePath}`)
    process.exit(1)
  }

  try {
    const ITranslationContent: ITranslationContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'))

    for (const language of targetLanguages) {
      // Skip the default language
      if (language === defaultLanguage) continue

      // Define the path to the target translation file
      const targetFilePath = path.join(process.cwd(), outputDir, `${language}.json`)

      let existingTranslations: ITranslationContent = {}
      // Load the existing translations from the target file if it exists
      if (fs.existsSync(targetFilePath)) {
        existingTranslations = JSON.parse(fs.readFileSync(targetFilePath, 'utf-8'))
      }

      const updateTranslations = await translateContent(ITranslationContent, existingTranslations, language)

      fs.writeFileSync(targetFilePath, JSON.stringify(updateTranslations, null, 2))
      console.log(`Translations updated for ${language} at ${targetFilePath}`)
    }

  } catch (error) {
    console.error('Error processing translations: ', (error as Error).message)
    process.exit(1)
  }

}
