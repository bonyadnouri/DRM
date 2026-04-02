import type { Attachment, Draft, IntakeEvent, Message, Profile, Task, Thread } from '../../domain/types.js';
import type { Repository } from '../persistence/repository.js';

export interface ThreadView extends Thread {
  profile: Profile | null;
  messages: Message[];
  drafts: Draft[];
  tasks: Task[];
}

export interface RepositoryState {
  profiles: Profile[];
  threads: Thread[];
  messages: Message[];
  drafts: Draft[];
  attachments: Attachment[];
  tasks: Task[];
  events: IntakeEvent[];
}

export interface FollowupView {
  task: Task;
  thread: Thread | null;
  profile: Profile | null;
  latestMessage: Message | null;
}

export interface RepositoryCounts {
  profiles: number;
  threads: number;
  messages: number;
  drafts: number;
  attachments: number;
  tasks: number;
  events: number;
}

export async function getRepositoryState(repository: Repository): Promise<RepositoryState> {
  const [profiles, threads, messages, drafts, attachments, tasks, events] = await Promise.all([
    repository.listProfiles(),
    repository.listThreads(),
    repository.listMessages(),
    repository.listDrafts(),
    repository.listAttachments(),
    repository.listTasks(),
    repository.listEvents(),
  ]);

  return {
    profiles,
    threads,
    messages,
    drafts,
    attachments,
    tasks,
    events,
  };
}

export async function getRepositoryCounts(repository: Repository): Promise<RepositoryCounts> {
  const [profiles, threads, messages, drafts, attachments, tasks, events] = await Promise.all([
    repository.listProfiles(),
    repository.listThreads(),
    repository.listMessages(),
    repository.listDrafts(),
    repository.listAttachments(),
    repository.listTasks(),
    repository.listEvents(),
  ]);

  return {
    profiles: profiles.length,
    threads: threads.length,
    messages: messages.length,
    drafts: drafts.length,
    attachments: attachments.length,
    tasks: tasks.length,
    events: events.length,
  };
}

export async function listThreadViews(repository: Repository): Promise<ThreadView[]> {
  const [profiles, threads, messages, drafts, tasks] = await Promise.all([
    repository.listProfiles(),
    repository.listThreads(),
    repository.listMessages(),
    repository.listDrafts(),
    repository.listTasks(),
  ]);

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const messagesByThreadId = groupBy(messages, (message) => message.threadId);
  const draftsByThreadId = groupBy(drafts, (draft) => draft.threadId);
  const tasksByThreadId = groupBy(tasks, (task) => task.threadId);

  return threads.map((thread) => ({
    ...thread,
    profile: profilesById.get(thread.profileId) ?? null,
    messages: messagesByThreadId.get(thread.id) ?? [],
    drafts: draftsByThreadId.get(thread.id) ?? [],
    tasks: tasksByThreadId.get(thread.id) ?? [],
  }));
}

export async function listOpenFollowups(repository: Repository): Promise<FollowupView[]> {
  const [profiles, threads, messages, tasks] = await Promise.all([
    repository.listProfiles(),
    repository.listThreads(),
    repository.listMessages(),
    repository.listTasks(),
  ]);

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const threadsById = new Map(threads.map((thread) => [thread.id, thread]));
  const latestMessageByThreadId = new Map<string, Message>();

  for (const message of messages) {
    latestMessageByThreadId.set(message.threadId, message);
  }

  return tasks
    .filter((task) => task.status === 'open')
    .sort((left, right) => compareOptionalDates(left.dueAt, right.dueAt))
    .map((task) => {
      const thread = threadsById.get(task.threadId) ?? null;
      const profile = thread ? (profilesById.get(thread.profileId) ?? null) : null;

      return {
        task,
        thread,
        profile,
        latestMessage: latestMessageByThreadId.get(task.threadId) ?? null,
      };
    });
}

function compareOptionalDates(left?: string, right?: string): number {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return left.localeCompare(right);
}

function groupBy<T>(values: T[], getKey: (value: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const value of values) {
    const key = getKey(value);
    const existing = grouped.get(key);
    if (existing) {
      existing.push(value);
      continue;
    }

    grouped.set(key, [value]);
  }

  return grouped;
}
