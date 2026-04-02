import type {
  ChatExtractionResult,
  ExtractionAdapter,
  ProfileExtractionResult,
} from './adapter.js';

export class MockLlmExtractionAdapter implements ExtractionAdapter {
  name = 'mock-llm-vision';

  async extract(input: {
    kind: 'profile_batch' | 'chat_batch';
    attachments: Array<{ filename: string; path?: string; mimeType?: string }>;
    instruction?: string;
  }): Promise<ProfileExtractionResult | ChatExtractionResult> {
    if (input.kind === 'profile_batch') {
      return {
        kind: 'profile_batch',
        displayName: 'Mila',
        age: 27,
        location: 'Berlin',
        bio: 'Consultant, padel addict, and elite overthinker.',
        promptSet: [
          {
            prompt: 'My simple pleasures',
            answer: 'airport bookstores and iced matcha',
          },
          {
            prompt: 'Together we could',
            answer: 'win a pub quiz or embarrass ourselves trying',
          },
        ],
        photoNotes: ['smiling portrait', 'padel court photo', 'rooftop dinner'],
        vibeTags: ['witty', 'active', 'social'],
        redFlags: [],
        extractionConfidence: 0.91,
        rawSummary: `Mock LLM extracted ${input.attachments.length} profile screenshots into structured profile fields.`,
      };
    }

    return {
      kind: 'chat_batch',
      threadHint: 'Mila / Berlin / padel',
      messages: [
        {
          direction: 'inbound',
          body: 'Hahaha okay fair, but only if you can keep up at padel.',
          confidence: 0.94,
        },
      ],
      extractionConfidence: 0.9,
      rawSummary: `Mock LLM extracted ${input.attachments.length} chat screenshots into normalized messages.`,
    };
  }
}
