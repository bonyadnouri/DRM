import type { IntakeRequest } from '../../domain/intake.js';
import type {
  ChatExtractionResult,
  ExtractionAdapter,
  ProfileExtractionResult,
} from '../extraction/adapter.js';
import type { Repository } from '../persistence/repository.js';
import { ensureDemoThread, processIntake, type IntakeResult } from './service.js';

export interface ExtractedIntakePipelineResult {
  extraction: ProfileExtractionResult | ChatExtractionResult;
  intake: IntakeRequest;
  result: IntakeResult;
}

export async function processExtractedIntake(params: {
  kind: 'profile_batch' | 'chat_batch';
  attachments: Array<{ filename: string; path?: string; mimeType?: string }>;
  extractionAdapter: ExtractionAdapter;
  repository: Repository;
}): Promise<ExtractedIntakePipelineResult> {
  const extraction = await extractScreenshots(params);
  const intake = await mapExtractionToIntake({
    kind: params.kind,
    attachments: params.attachments,
    extraction,
    repository: params.repository,
  });
  const result = await processIntake(intake, params.repository);

  return {
    extraction,
    intake,
    result,
  };
}

export async function extractScreenshots(params: {
  kind: 'profile_batch' | 'chat_batch';
  attachments: Array<{ filename: string; path?: string; mimeType?: string }>;
  extractionAdapter: ExtractionAdapter;
}): Promise<ProfileExtractionResult | ChatExtractionResult> {
  const extraction = await params.extractionAdapter.extract({
    kind: params.kind,
    attachments: params.attachments,
    instruction:
      params.kind === 'profile_batch'
        ? 'Extract the profile screenshots into structured Hinge profile JSON.'
        : 'Extract the chat screenshots into normalized Hinge chat JSON.',
  });

  return params.kind === 'profile_batch'
    ? normalizeProfileExtraction(extraction as ProfileExtractionResult)
    : normalizeChatExtraction(extraction as ChatExtractionResult);
}

export async function mapExtractionToIntake(params: {
  kind: 'profile_batch' | 'chat_batch';
  attachments: Array<{ filename: string; path?: string; mimeType?: string }>;
  extraction: ProfileExtractionResult | ChatExtractionResult;
  repository: Repository;
}): Promise<IntakeRequest> {
  if (params.kind === 'profile_batch') {
    const profile = normalizeProfileExtraction(params.extraction as ProfileExtractionResult);

    return {
      kind: 'profile_batch',
      attachments: params.attachments,
      profile: {
        displayName: profile.displayName,
        age: profile.age,
        location: profile.location,
        bio: profile.bio,
        promptSet: profile.promptSet,
        photoNotes: profile.photoNotes,
        vibeTags: profile.vibeTags,
        redFlags: profile.redFlags,
        extractionConfidence: profile.extractionConfidence,
      },
      messages: [],
    };
  }

  const chat = normalizeChatExtraction(params.extraction as ChatExtractionResult);
  const threadId = await resolveChatThreadId(params.repository, chat.threadHint);

  return {
    kind: 'chat_batch',
    attachments: params.attachments,
    threadId,
    messages: chat.messages,
  };
}

function normalizeProfileExtraction(extraction: ProfileExtractionResult): ProfileExtractionResult {
  const displayName = cleanString(extraction.displayName) || 'Unknown';
  const promptSet = (extraction.promptSet ?? [])
    .map((entry) => ({
      prompt: cleanString(entry.prompt),
      answer: cleanString(entry.answer),
    }))
    .filter((entry) => entry.prompt && entry.answer);

  return {
    kind: 'profile_batch',
    displayName,
    age: normalizeAge(extraction.age),
    location: optionalString(extraction.location),
    bio: optionalString(extraction.bio),
    promptSet,
    photoNotes: normalizeStringList(extraction.photoNotes),
    vibeTags: normalizeStringList(extraction.vibeTags),
    redFlags: normalizeStringList(extraction.redFlags),
    extractionConfidence: normalizeConfidence(extraction.extractionConfidence, 0.7),
    rawSummary: optionalString(extraction.rawSummary),
  };
}

function normalizeChatExtraction(extraction: ChatExtractionResult): ChatExtractionResult {
  const messages = (extraction.messages ?? [])
    .map((message) => ({
      direction: (message.direction === 'outbound' ? 'outbound' : 'inbound') as 'inbound' | 'outbound',
      body: cleanString(message.body),
      confidence: normalizeConfidence(message.confidence, 0.8),
    }))
    .filter((message) => message.body.length > 0);

  return {
    kind: 'chat_batch',
    threadHint: optionalString(extraction.threadHint),
    messages,
    extractionConfidence: normalizeConfidence(extraction.extractionConfidence, 0.7),
    rawSummary: optionalString(extraction.rawSummary),
  };
}

async function resolveChatThreadId(repository: Repository, threadHint?: string): Promise<string> {
  const normalizedHint = threadHint?.trim().toLowerCase();
  if (normalizedHint) {
    const threads = await repository.listThreads();
    const profiles = await repository.listProfiles();
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

    for (const thread of threads) {
      const profile = profilesById.get(thread.profileId);
      const candidateText = [
        thread.id,
        thread.lastSummary,
        thread.nextGoal,
        profile?.displayName,
        profile?.location,
        ...(profile?.vibeTags ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (candidateText.includes(normalizedHint)) {
        return thread.id;
      }
    }
  }

  const demoThread = await ensureDemoThread(repository);
  return demoThread.id;
}

function normalizeStringList(values?: string[]): string[] {
  return (values ?? []).map(cleanString).filter(Boolean);
}

function normalizeAge(age?: number): number | undefined {
  if (!age || !Number.isFinite(age)) return undefined;
  if (age < 18 || age > 99) return undefined;
  return Math.round(age);
}

function normalizeConfidence(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function optionalString(value?: string): string | undefined {
  const cleaned = cleanString(value);
  return cleaned || undefined;
}

function cleanString(value?: string): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}
