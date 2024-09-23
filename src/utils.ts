import path from 'path'
import fs from 'fs'
import { BaseContent, TranslationConfig } from '../types/types'
import { translateContent } from './translate'

// Define the path to the configuration file
export const configPath = path.join(process.cwd(), 'translation.config.js')

export async function loadConfig(): Promise<TranslationConfig> {
  try {
    // Ensure the config file exists
    if (!fs.existsSync(configPath)) {
      console.log('Error: translation.config.js not found.')
      process.exit(1)
    }
    // Loading and returning the configuration
    return (await import(configPath)).translationConfig

  } catch (error) {
    console.error('Error loading configuration: ', (error as Error).message)
    process.exit(1)
  }
}

export async function processTranslations(config: TranslationConfig): Promise<void> {
  const { defaultLanguage, targetLanguages, inputDir, outputDir, format, aiProvider } = config
  const baseFilePath = path.join(process.cwd(), inputDir, `${defaultLanguage}.${format}`)

  if (!fs.existsSync(baseFilePath)) {
    console.error(`Error: Base translation file not found at ${baseFilePath}`)
    process.exit(1)
  }

  try {
    const baseContent: BaseContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'))

    for (const language of targetLanguages) {
      // Skip the default language
      if (language === defaultLanguage) continue

      // Define the path to the target translation file
      const targetFilePath = path.join(process.cwd(), outputDir, `${language}.${format}`)

      let existingTranslations: BaseContent = {}
      // Load the existing translations from the target file if it exists
      if (fs.existsSync(targetFilePath)) {
        existingTranslations = JSON.parse(fs.readFileSync(targetFilePath, 'utf-8'))
      }

      const updateTranslations = await translateContent(baseContent, existingTranslations, language)
    }

  } catch (error) {
    console.error('Error processing translations: ', (error as Error).message)
    process.exit(1)
  }

}
