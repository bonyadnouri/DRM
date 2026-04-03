import type { IntakeRequest } from '../../domain/intake.js';
import type { ExtractionAdapter } from '../extraction/adapter.js';
import type { Repository } from '../persistence/repository.js';
import { ensureDemoThread, processIntake, type IntakeResult } from './service.js';

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

  const intake = await mapExtractionToIntake({
    kind: params.kind,
    attachments: params.attachments,
    extraction,
    repository: params.repository,
  });
  const result = await processIntake(intake, params.repository);

  return {
    extraction,
    result,
  };
}

async function mapExtractionToIntake(params: {
  kind: 'profile_batch' | 'chat_batch';
  attachments: Array<{ filename: string; path?: string; mimeType?: string }>;
  extraction: unknown;
  repository: Repository;
}): Promise<IntakeRequest> {
  if (params.kind === 'profile_batch') {
    const profile = params.extraction as {
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
      attachments: params.attachments,
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

  const chat = params.extraction as {
    threadHint?: string;
    messages?: Array<{ direction: 'inbound' | 'outbound'; body: string; confidence: number }>;
  };

  const demoThread = await ensureDemoThread(params.repository);

  return {
    kind: 'chat_batch',
    attachments: params.attachments,
    threadId: demoThread.id,
    messages: chat.messages ?? [],
  };
}
