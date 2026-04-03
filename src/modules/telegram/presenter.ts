import type { Draft, Profile, Task, Thread } from '../../domain/types.js';
import type { FollowupView, ThreadView } from '../crm/query-service.js';

export function formatProfileResult(params: {
  profile: Profile;
  thread: Thread;
  summary: string;
  drafts: Draft[];
}): string {
  const recommended = params.drafts.find((draft) => draft.styleVariant === 'recommended') ?? params.drafts[0];
  const alternatives = params.drafts.filter((draft) => draft.id !== recommended?.id).slice(0, 2);

  return [
    `New profile: ${params.profile.displayName}${params.profile.age ? `, ${params.profile.age}` : ''}`,
    `Thread: ${params.thread.id}`,
    `Stage: ${params.thread.stage}`,
    `Summary: ${params.summary}`,
    '',
    `Recommended opener: ${recommended?.body ?? 'n/a'}`,
    alternatives.length > 0 ? '' : null,
    alternatives.length > 0 ? 'Alternatives:' : null,
    ...alternatives.map((draft) => `- (${draft.styleVariant}) ${draft.body}`),
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatChatResult(params: {
  profileName: string;
  thread: Thread;
  summary: string;
  drafts: Draft[];
  task?: Task;
}): string {
  const recommended = params.drafts.find((draft) => draft.styleVariant === 'recommended') ?? params.drafts[0];
  const alternatives = params.drafts.filter((draft) => draft.id !== recommended?.id).slice(0, 2);

  return [
    `Chat update: ${params.profileName}`,
    `Thread: ${params.thread.id}`,
    `Stage: ${params.thread.stage}`,
    `Summary: ${params.summary}`,
    '',
    `Recommended reply: ${recommended?.body ?? 'n/a'}`,
    alternatives.length > 0 ? '' : null,
    alternatives.length > 0 ? 'Alternatives:' : null,
    ...alternatives.map((draft) => `- (${draft.styleVariant}) ${draft.body}`),
    params.task ? '' : null,
    params.task ? `Follow-up task: ${params.task.note}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatFollowupList(followups: FollowupView[]): string {
  if (followups.length === 0) {
    return 'No open follow-ups right now.';
  }

  return [
    'Open follow-ups:',
    ...followups.slice(0, 10).map((followup, index) => {
      const profileName = followup.profile?.displayName ?? 'Unknown';
      const due = followup.task.dueAt ? `due ${followup.task.dueAt}` : 'no due date';
      return `${index + 1}. ${profileName} • ${followup.task.threadId} • ${due} • ${followup.task.note}`;
    }),
  ].join('\n');
}

export function formatThreadDetail(threadView: ThreadView): string {
  const recentMessages = threadView.messages.slice(-3);
  const latestDrafts = threadView.drafts.slice(-2);
  const openTasks = threadView.tasks.filter((task) => task.status === 'open');

  return [
    `Thread: ${threadView.id}`,
    `Profile: ${threadView.profile?.displayName ?? 'Unknown'}`,
    `Stage: ${threadView.stage}`,
    threadView.lastSummary ? `Summary: ${threadView.lastSummary}` : null,
    '',
    'Recent messages:',
    ...(recentMessages.length > 0
      ? recentMessages.map((message) => `- ${message.direction}: ${message.body}`)
      : ['- none']),
    '',
    'Latest drafts:',
    ...(latestDrafts.length > 0
      ? latestDrafts.map((draft) => `- (${draft.styleVariant}) ${draft.body}`)
      : ['- none']),
    '',
    'Open tasks:',
    ...(openTasks.length > 0
      ? openTasks.map((task) => `- ${task.type}: ${task.note}`)
      : ['- none']),
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatActionConfirmation(params: {
  target: 'thread' | 'task' | 'message';
  id: string;
  action: string;
  detail?: string;
}): string {
  return [
    `Action completed: ${params.action}`,
    `${params.target}: ${params.id}`,
    params.detail ?? null,
  ]
    .filter(Boolean)
    .join('\n');
}
