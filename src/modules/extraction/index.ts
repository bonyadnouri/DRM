import type { ExtractionAdapter } from './adapter.js';
import { MockLlmExtractionAdapter } from './mock-llm-adapter.js';
import { OpenAiVisionExtractionAdapter } from './openai-vision-adapter.js';

export function createExtractionAdapter(): ExtractionAdapter {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAiVisionExtractionAdapter();
  }

  return new MockLlmExtractionAdapter();
}
