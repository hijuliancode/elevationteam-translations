import { TranslationConfig  } from "../types/types"
import { processTranslations } from "./utils"

export async function run(config: TranslationConfig): Promise<void> {
  await processTranslations(config)
}
