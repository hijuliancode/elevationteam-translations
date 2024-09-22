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
    const cleanedText = text.trim().replace(/\s+/g, ' '); // Preprocess the text to remove unnecessary spaces
    
    try {
      const response = await this.opeanai.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',
        messages: [
          { role: 'system', content: 'Translate texts accurately' },
          { role: 'user', content: `Translate to ${targetLanguage}: "${cleanedText}"` }
        ],
        max_tokens: 100, // Limit the number of tokens in the response
      });

      console.log('OpenAI response:', response);
      console.log('response.choices:', response.choices);
      console.log('response.choices[0]?.message:', response.choices[0]?.message);
      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error translating text', error);
      process.exit(1);
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
