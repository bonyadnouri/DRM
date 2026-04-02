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

export async function getRepositoryCounts(repository: Repository) {
  const state = await getRepositoryState(repository);

  return {
    profiles: state.profiles.length,
    threads: state.threads.length,
    messages: state.messages.length,
    drafts: state.drafts.length,
    attachments: state.attachments.length,
    tasks: state.tasks.length,
    events: state.events.length,
  };
}

export async function listThreadViews(repository: Repository): Promise<ThreadView[]> {
  const state = await getRepositoryState(repository);
  const profilesById = new Map(state.profiles.map((profile) => [profile.id, profile]));

  return state.threads.map((thread) => ({
    ...thread,
    profile: profilesById.get(thread.profileId) ?? null,
    messages: state.messages.filter((message) => message.threadId === thread.id),
    drafts: state.drafts.filter((draft) => draft.threadId === thread.id),
    tasks: state.tasks.filter((task) => task.threadId === thread.id),
  }));
}

export async function listOpenFollowups(repository: Repository): Promise<FollowupView[]> {
  const state = await getRepositoryState(repository);
  const profilesById = new Map(state.profiles.map((profile) => [profile.id, profile]));
  const threadsById = new Map(state.threads.map((thread) => [thread.id, thread]));
  const latestMessageByThreadId = new Map<string, Message>();

  for (const message of state.messages) {
    latestMessageByThreadId.set(message.threadId, message);
  }

  return state.tasks
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
