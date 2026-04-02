import type {
  Attachment,
  Draft,
  IntakeEvent,
  Message,
  Profile,
  Task,
  Thread,
} from '../../domain/types.js';
import { inMemoryStore } from '../crm/in-memory-store.js';

export interface Repository {
  readonly name: string;
  saveAttachments(attachments: Attachment[]): Promise<void>;
  saveProfile(profile: Profile): Promise<void>;
  saveThread(thread: Thread): Promise<void>;
  saveMessages(messages: Message[]): Promise<void>;
  saveDrafts(drafts: Draft[]): Promise<void>;
  saveTask(task: Task): Promise<void>;
  saveEvent(event: IntakeEvent): Promise<void>;
  listProfiles(): Promise<Profile[]>;
  getProfile(profileId: string): Promise<Profile | undefined>;
  listThreads(): Promise<Thread[]>;
  getThread(threadId: string): Promise<Thread | undefined>;
  listMessages(): Promise<Message[]>;
  listDrafts(): Promise<Draft[]>;
  listTasks(): Promise<Task[]>;
  listAttachments(): Promise<Attachment[]>;
  listEvents(): Promise<IntakeEvent[]>;
}

export class InMemoryRepository implements Repository {
  readonly name = 'memory';

  async saveAttachments(attachments: Attachment[]): Promise<void> {
    upsertMany(inMemoryStore.attachments, attachments);
  }

  async saveProfile(profile: Profile): Promise<void> {
    upsertOne(inMemoryStore.profiles, profile);
  }

  async saveThread(thread: Thread): Promise<void> {
    upsertOne(inMemoryStore.threads, thread);
  }

  async saveMessages(messages: Message[]): Promise<void> {
    upsertMany(inMemoryStore.messages, messages);
  }

  async saveDrafts(drafts: Draft[]): Promise<void> {
    upsertMany(inMemoryStore.drafts, drafts);
  }

  async saveTask(task: Task): Promise<void> {
    upsertOne(inMemoryStore.tasks, task);
  }

  async saveEvent(event: IntakeEvent): Promise<void> {
    upsertOne(inMemoryStore.events, event);
  }

  async listProfiles(): Promise<Profile[]> {
    return inMemoryStore.profiles;
  }

  async getProfile(profileId: string): Promise<Profile | undefined> {
    return inMemoryStore.profiles.find((profile) => profile.id === profileId);
  }

  async listThreads(): Promise<Thread[]> {
    return inMemoryStore.threads;
  }

  async getThread(threadId: string): Promise<Thread | undefined> {
    return inMemoryStore.threads.find((thread) => thread.id === threadId);
  }

  async listMessages(): Promise<Message[]> {
    return inMemoryStore.messages;
  }

  async listDrafts(): Promise<Draft[]> {
    return inMemoryStore.drafts;
  }

  async listTasks(): Promise<Task[]> {
    return inMemoryStore.tasks;
  }

  async listAttachments(): Promise<Attachment[]> {
    return inMemoryStore.attachments;
  }

  async listEvents(): Promise<IntakeEvent[]> {
    return inMemoryStore.events;
  }
}

function upsertOne<T extends { id: string }>(target: T[], value: T): void {
  const index = target.findIndex((candidate) => candidate.id === value.id);
  if (index >= 0) {
    target[index] = value;
    return;
  }

  target.push(value);
}

function upsertMany<T extends { id: string }>(target: T[], values: T[]): void {
  for (const value of values) {
    upsertOne(target, value);
  }
}
