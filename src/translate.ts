import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  organization: 'org-1e3b1b1b-1e3b-1e3b-1e3b-1e3b1e3b1e3b',
  apiKey: process.env.OPENAI_API_KEY,
  project: 'proj-1e3b1b1b-1e3b-1e3b-1e3b-1e3b1e3b1e3b',
});

export async function translate(text: string, targetLanguage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that translates text.' },
        { role: 'user', content: `Translate the following text to ${targetLanguage}: "${text}"` }
      ],
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error translating text', error);
    return '';
  }
}
