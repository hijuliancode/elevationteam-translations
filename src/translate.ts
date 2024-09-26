import { OpenAI } from 'openai'
import { ITranslationContent } from './types/types'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function translateContent (
  ITranslationContent: ITranslationContent,
  existingTranslations: ITranslationContent,
  targetLanguage: string
): Promise<ITranslationContent> {
  const updatedTranslations: ITranslationContent = { ...existingTranslations }

  for (const [key, value] of Object.entries(ITranslationContent)) {
    // Check if the value is a nested object
    if (typeof value === 'string' && (!existingTranslations[key] || existingTranslations[key] !== value)) {
      try {
        const translatedValue = await translate(value, targetLanguage)
        updatedTranslations[key] = translatedValue
      } catch (error) {
        console.error(`Error translating key: ${key} to ${targetLanguage}: ${(error as Error).message}`)
      }
    } else if (typeof value === 'object') {
      updatedTranslations[key] = await translateContent(
        value as ITranslationContent,
        existingTranslations[key] as ITranslationContent,
        targetLanguage
      )
    }
  }

  return updatedTranslations;
}

async function translate(text: string, targetLanguage: string): Promise<string> {

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      messages: [
        { role: 'system', content: `You are a professional translator. Translate the following text to ${targetLanguage}:` },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 100,
    })

    console.log('---')
    console.log('response', response)
    console.log('---')
    console.log('response.choices', response.choices)
    console.log('---')
    console.log('response.choices[0]', response.choices[0])
    console.log('---')
    console.log('response.choices[0]?.message', response.choices[0]?.message)
    console.log('---')

    return response.choices[0]?.message?.content?.trim() || text
  } catch (error) {
    console.error('Error translating text:', (error as Error).message)
    return text
  }
}
