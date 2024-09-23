import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'
import { TranslationConfig } from '../types/types'
import { processTranslations } from './utils'

export async function watch(config: TranslationConfig): Promise<void> {
  const { defaultLanguage, inputDir, format } = config
  const baseFilePath = path.join(process.cwd(), inputDir, `${defaultLanguage}.${format}`)

  if (!fs.existsSync(baseFilePath)) {
    console.error(`Error: Base translation file not found at ${baseFilePath}`)
    process.exit(1)
  }

  const watcher = chokidar.watch(baseFilePath)

  watcher.on('change', async () => {
    console.log('Translation file changed. Processing translations...')
  
    try {
      await processTranslations(config)
      console.log('Translations processed successfully.')
    } catch (error) {
      console.error('Error processing translations: ', (error as Error).message)
    }
  
    console.log(`Watching for changes in ${baseFilePath}`);
  })

}