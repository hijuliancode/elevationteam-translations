import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'
import { ITranslationConfig } from './types/types'
import { processTranslations } from './utils'
import { getErrorMessage } from './errors'

export async function watch(config: ITranslationConfig): Promise<void> {
  const { defaultLanguage, inputDir } = config
  const baseFilePath = path.join(process.cwd(), inputDir, `${defaultLanguage}.json`)

  if (!fs.existsSync(baseFilePath)) {
    console.error(`Error: Base translation file not found at ${baseFilePath}`)
    process.exit(1)
  }

  const watcher = chokidar.watch(baseFilePath)
  console.log(`[et-translations] Watching: ${path.relative(process.cwd(), baseFilePath)}`)
  console.log(`[et-translations] Only new or modified keys will be sent to the AI provider.`)
  console.log(`[et-translations] Source code and other files are NOT monitored.`)

  // Prevents concurrent translation runs if the file is saved rapidly
  let isProcessing = false

  watcher.on('change', async () => {
    if (isProcessing) return
    isProcessing = true
    console.log('\n[et-translations] Change detected — processing...')

    try {
      await processTranslations(config)
      console.log('[et-translations] Translations updated successfully.')
    } catch (error) {
      console.error('[et-translations] Error processing translations:', getErrorMessage(error))
    } finally {
      isProcessing = false
    }
  })

  const cleanup = async () => {
    await watcher.close()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}
