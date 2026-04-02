export type Platform = 'hinge';

export type ThreadStage =
  | 'new'
  | 'opened'
  | 'active'
  | 'followup_needed'
  | 'close_candidate'
  | 'closed';

export type MessageDirection = 'inbound' | 'outbound';
export type DraftType = 'opener' | 'reply' | 'followup';
export type DraftStyleVariant = 'safe' | 'playful' | 'bold' | 'recommended';

export interface PromptAnswer {
  prompt: string;
  answer: string;
}

export interface Profile {
  id: string;
  platform: Platform;
  displayName: string;
  age?: number;
  location?: string;
  bio?: string;
  promptSet: PromptAnswer[];
  photoNotes: string[];
  vibeTags: string[];
  redFlags: string[];
  extractionConfidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface Thread {
  id: string;
  profileId: string;
  stage: ThreadStage;
  nextGoal?: string;
  lastSummary?: string;
  followupDueAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  direction: MessageDirection;
  body: string;
  confidence: number;
  createdAt: string;
}

export interface Draft {
  id: string;
  threadId: string;
  type: DraftType;
  styleVariant: DraftStyleVariant;
  body: string;
  rationale?: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  path: string;
  source: 'telegram_upload' | 'manual_test';
  sha256?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  threadId: string;
  type: 'followup' | 'review' | 'clarify_identity';
  dueAt?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'done';
  note: string;
  createdAt: string;
}

export interface IntakeEvent {
  id: string;
  intakeJobId: string;
  kind: 'received' | 'classified' | 'profile_created' | 'thread_created' | 'messages_added' | 'drafts_generated';
  createdAt: string;
  payload: Record<string, unknown>;
}
