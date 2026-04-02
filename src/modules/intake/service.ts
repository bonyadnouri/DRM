import type {
  IntakeRequest,
  ProfilePayload,
  ChatMessageInput,
} from '../../domain/intake.js';
import type {
  Attachment,
  Draft,
  IntakeEvent,
  Message,
  Profile,
  Task,
  Thread,
} from '../../domain/types.js';
import { mockOpenerDrafts, mockReplyDrafts } from '../drafting/mock-drafts.js';
import { scoreProfileMatch } from '../identity/matcher.js';
import type { Repository } from '../persistence/repository.js';
import { InMemoryRepository } from '../persistence/repository.js';

export interface IntakeResult {
  intakeJobId: string;
  kind: IntakeRequest['kind'];
  profile?: Profile;
  thread?: Thread;
  summary?: string;
  recommendedDraft?: Draft;
  drafts?: Draft[];
  addedMessages?: Message[];
  task?: Task;
  status?: 'ignored';
  reason?: string;
}

const defaultRepository = new InMemoryRepository();

export async function processIntake(
  input: IntakeRequest,
  repository: Repository = defaultRepository,
): Promise<IntakeResult> {
  const intakeJobId = crypto.randomUUID();
  const now = new Date().toISOString();

  const attachments = input.attachments.map<Attachment>((attachment) => ({
    id: crypto.randomUUID(),
    filename: attachment.filename,
    path: attachment.path ?? attachment.filename,
    source: 'manual_test',
    createdAt: now,
  }));
  await repository.saveAttachments(attachments);

  await recordEvent(repository, intakeJobId, 'received', {
    kind: input.kind,
    attachmentCount: attachments.length,
  });

  await recordEvent(repository, intakeJobId, 'classified', {
    kind: input.kind,
  });

  if (input.kind === 'profile_batch' && input.profile) {
    return handleProfileBatch(intakeJobId, input.profile, attachments, repository);
  }

  if (input.kind === 'chat_batch' && input.threadId) {
    return handleChatBatch(intakeJobId, input.threadId, input.messages, repository);
  }

  return {
    intakeJobId,
    kind: input.kind,
    status: 'ignored',
    reason: 'unknown intake kind',
  };
}

export async function ensureDemoThread(repository: Repository = defaultRepository): Promise<Thread> {
  const existing = (await repository.listThreads()).at(0);
  if (existing) return existing;

  const profile = createProfile({
    displayName: 'Mila',
    age: 27,
    location: 'Berlin',
    bio: 'Consultant, padel addict, and elite overthinker.',
    promptSet: [
      {
        prompt: 'The way to win me over is',
        answer: 'banter, snacks, and not being boring',
      },
    ],
    photoNotes: ['padel court', 'sunset rooftop'],
    vibeTags: ['witty', 'active'],
    redFlags: [],
    extractionConfidence: 0.9,
  });
  await repository.saveProfile(profile);

  const thread = createThread(profile.id, {
    stage: 'opened',
    nextGoal: 'Build momentum',
    lastSummary: 'Warm match, playful energy, sport/training hook available.',
  });
  await repository.saveThread(thread);

  return thread;
}

async function handleProfileBatch(
  intakeJobId: string,
  profileInput: ProfilePayload,
  _attachments: Attachment[],
  repository: Repository,
): Promise<IntakeResult> {
  const existingProfiles = await repository.listProfiles();
  const match = scoreProfileMatch({
    incoming: profileInput,
    existingProfiles,
  });

  const existingProfile = match.bestCandidate
    ? existingProfiles.find((profile) => profile.id === match.bestCandidate?.profileId)
    : undefined;

  const profile =
    match.decision === 'create_new' || !existingProfile ? createProfile(profileInput) : existingProfile;

  if (!existingProfile || match.decision === 'create_new') {
    await repository.saveProfile(profile);
    await recordEvent(repository, intakeJobId, 'profile_created', {
      profileId: profile.id,
      displayName: profile.displayName,
      identityDecision: match.decision,
      candidates: match.candidates,
    });
  }

  const thread = createThread(profile.id, {
    stage: existingProfile ? 'opened' : 'new',
    nextGoal: 'Send opener',
    lastSummary: buildProfileSummary(profile),
  });
  await repository.saveThread(thread);
  await recordEvent(repository, intakeJobId, 'thread_created', {
    threadId: thread.id,
    profileId: profile.id,
    identityDecision: match.decision,
  });

  const drafts = mockOpenerDrafts(thread.id, profile.displayName);
  await repository.saveDrafts(drafts);
  await recordEvent(repository, intakeJobId, 'drafts_generated', {
    threadId: thread.id,
    draftType: 'opener',
    count: drafts.length,
  });

  return {
    intakeJobId,
    kind: 'profile_batch',
    profile,
    thread,
    summary: `${buildProfileSummary(profile)}${
      match.bestCandidate
        ? ` • identity: ${match.decision} (${match.bestCandidate.score}, ${match.bestCandidate.evidence.join(', ')})`
        : ''
    }`,
    recommendedDraft: drafts.find((draft) => draft.styleVariant === 'recommended') ?? drafts[0],
    drafts,
  };
}

async function handleChatBatch(
  intakeJobId: string,
  threadId: string,
  inputMessages: ChatMessageInput[],
  repository: Repository,
): Promise<IntakeResult> {
  const thread = await repository.getThread(threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`);
  }

  const createdMessages = inputMessages.map<Message>((message) => ({
    id: crypto.randomUUID(),
    threadId,
    direction: message.direction,
    body: message.body,
    confidence: message.confidence,
    createdAt: new Date().toISOString(),
  }));
  await repository.saveMessages(createdMessages);
  await recordEvent(repository, intakeJobId, 'messages_added', {
    threadId,
    count: createdMessages.length,
  });

  const latestInbound = [...createdMessages].reverse().find((message) => message.direction === 'inbound');
  const drafts = mockReplyDrafts(threadId, latestInbound?.body ?? '');
  await repository.saveDrafts(drafts);
  await recordEvent(repository, intakeJobId, 'drafts_generated', {
    threadId,
    draftType: 'reply',
    count: drafts.length,
  });

  const profile = await repository.getProfile(thread.profileId);
  thread.stage = 'active';
  thread.nextGoal = 'Keep momentum and move toward number/date';
  thread.lastSummary = buildChatSummary(createdMessages);
  thread.updatedAt = new Date().toISOString();
  await repository.saveThread(thread);

  const task = createTask(threadId, {
    type: 'followup',
    priority: 'medium',
    note: 'If no response after latest reply, follow up within 48 hours.',
  });
  await repository.saveTask(task);

  return {
    intakeJobId,
    kind: 'chat_batch',
    profile,
    thread,
    addedMessages: createdMessages,
    summary: thread.lastSummary,
    recommendedDraft: drafts.find((draft) => draft.styleVariant === 'recommended') ?? drafts[0],
    drafts,
    task,
  };
}

function createProfile(input: ProfilePayload): Profile {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    platform: 'hinge',
    displayName: input.displayName,
    age: input.age,
    location: input.location,
    bio: input.bio,
    promptSet: input.promptSet,
    photoNotes: input.photoNotes,
    vibeTags: input.vibeTags,
    redFlags: input.redFlags,
    extractionConfidence: input.extractionConfidence,
    createdAt: now,
    updatedAt: now,
  };
}

function createThread(
  profileId: string,
  values: Pick<Thread, 'stage' | 'nextGoal' | 'lastSummary'>,
): Thread {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    profileId,
    stage: values.stage,
    nextGoal: values.nextGoal,
    lastSummary: values.lastSummary,
    createdAt: now,
    updatedAt: now,
  };
}

function createTask(
  threadId: string,
  values: Pick<Task, 'type' | 'priority' | 'note'>,
): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    threadId,
    type: values.type,
    priority: values.priority,
    status: 'open',
    note: values.note,
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    createdAt: now,
  };
}

function buildProfileSummary(profile: Profile): string {
  const parts = [
    `${profile.displayName}${profile.age ? `, ${profile.age}` : ''}`,
    profile.location,
    profile.bio,
    profile.promptSet[0] ? `${profile.promptSet[0].prompt}: ${profile.promptSet[0].answer}` : undefined,
    profile.vibeTags.length ? `vibe: ${profile.vibeTags.join(', ')}` : undefined,
  ].filter(Boolean);

  return parts.join(' • ');
}

function buildChatSummary(messages: Message[]): string {
  const inbound = messages.filter((message) => message.direction === 'inbound').length;
  const outbound = messages.filter((message) => message.direction === 'outbound').length;
  const latest = messages.at(-1)?.body;
  return `Chat updated with ${messages.length} new messages (${inbound} inbound, ${outbound} outbound). Latest: ${latest ?? 'n/a'}`;
}

async function recordEvent(
  repository: Repository,
  intakeJobId: string,
  kind: IntakeEvent['kind'],
  payload: Record<string, unknown>,
): Promise<IntakeEvent> {
  const event: IntakeEvent = {
    id: crypto.randomUUID(),
    intakeJobId,
    kind,
    createdAt: new Date().toISOString(),
    payload,
  };
  await repository.saveEvent(event);
  return event;
}
