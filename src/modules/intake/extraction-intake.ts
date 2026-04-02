import type { IntakeRequest } from '../../domain/intake.js';
import type { ExtractionAdapter } from '../extraction/adapter.js';
import type { Repository } from '../persistence/repository.js';
import { processIntake, type IntakeResult } from './service.js';

export async function processExtractedIntake(params: {
  kind: 'profile_batch' | 'chat_batch';
  attachments: Array<{ filename: string; path?: string; mimeType?: string }>;
  extractionAdapter: ExtractionAdapter;
  repository: Repository;
}): Promise<{ extraction: unknown; result: IntakeResult }> {
  const extraction = await params.extractionAdapter.extract({
    kind: params.kind,
    attachments: params.attachments,
    instruction:
      params.kind === 'profile_batch'
        ? 'Extract the profile screenshots into structured Hinge profile JSON.'
        : 'Extract the chat screenshots into normalized Hinge chat JSON.',
  });

  const intake = mapExtractionToIntake(params.kind, params.attachments, extraction);
  const result = await processIntake(intake, params.repository);

  return {
    extraction,
    result,
  };
}

function mapExtractionToIntake(
  kind: 'profile_batch' | 'chat_batch',
  attachments: Array<{ filename: string; path?: string; mimeType?: string }>,
  extraction: unknown,
): IntakeRequest {
  if (kind === 'profile_batch') {
    const profile = extraction as {
      displayName: string;
      age?: number;
      location?: string;
      bio?: string;
      promptSet?: Array<{ prompt: string; answer: string }>;
      photoNotes?: string[];
      vibeTags?: string[];
      redFlags?: string[];
      extractionConfidence?: number;
    };

    return {
      kind: 'profile_batch',
      attachments,
      profile: {
        displayName: profile.displayName,
        age: profile.age,
        location: profile.location,
        bio: profile.bio,
        promptSet: profile.promptSet ?? [],
        photoNotes: profile.photoNotes ?? [],
        vibeTags: profile.vibeTags ?? [],
        redFlags: profile.redFlags ?? [],
        extractionConfidence: profile.extractionConfidence ?? 0.7,
      },
      messages: [],
    };
  }

  const chat = extraction as {
    threadHint?: string;
    messages?: Array<{ direction: 'inbound' | 'outbound'; body: string; confidence: number }>;
  };

  return {
    kind: 'chat_batch',
    attachments,
    threadId: chat.threadHint ?? 'demo-thread',
    messages: chat.messages ?? [],
  };
}
