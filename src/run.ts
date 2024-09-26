import { ITranslationConfig  } from './types/types'
import { processTranslations } from './utils'

export async function run(config: ITranslationConfig): Promise<void> {
  await processTranslations(config)
}
