import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class OpenAIClient {
  private opeanai: OpenAI;

  constructor(apiKey: string, organization?: string) {
    this.opeanai = new OpenAI({
      apiKey,
      organization,
    })
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await this.opeanai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that translates text.' },
          { role: 'user', content: `Translate the following text to ${targetLanguage}: "${text}"` }
        ],
      })
      return response.choices[0]?.message?.content?.trim() || '';
    } catch(error) {
      console.error('Error translating text', error);
      return '';
    }
  }
}

const apiKey = process.env.OPENAI_API_KEY;
const organization = process.env.OPENAI_ORGANIZATION;

if (!apiKey) {
  console.error('Error: OPENAI_API_KEY is required to use the OpenAI API');
  process.exit(1);
}

export const openAIClient = new OpenAIClient(apiKey!, organization);
