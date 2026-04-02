import type { Draft, Profile, Task, Thread } from '../../domain/types.js';

export function formatProfileResult(params: {
  profile: Profile;
  thread: Thread;
  summary: string;
  drafts: Draft[];
}): string {
  const recommended = params.drafts.find((draft) => draft.styleVariant === 'recommended') ?? params.drafts[0];
  const alternatives = params.drafts.filter((draft) => draft.id !== recommended?.id);

  return [
    `New profile: ${params.profile.displayName}${params.profile.age ? `, ${params.profile.age}` : ''}`,
    `Stage: ${params.thread.stage}`,
    `Summary: ${params.summary}`,
    '',
    `Recommended opener: ${recommended?.body ?? 'n/a'}`,
    '',
    'Alternatives:',
    ...alternatives.map((draft) => `- (${draft.styleVariant}) ${draft.body}`),
  ].join('\n');
}

export function formatChatResult(params: {
  profileName: string;
  thread: Thread;
  summary: string;
  drafts: Draft[];
  task?: Task;
}): string {
  const recommended = params.drafts.find((draft) => draft.styleVariant === 'recommended') ?? params.drafts[0];
  const alternatives = params.drafts.filter((draft) => draft.id !== recommended?.id);

  return [
    `Chat update: ${params.profileName}`,
    `Stage: ${params.thread.stage}`,
    `Summary: ${params.summary}`,
    '',
    `Recommended reply: ${recommended?.body ?? 'n/a'}`,
    '',
    'Alternatives:',
    ...alternatives.map((draft) => `- (${draft.styleVariant}) ${draft.body}`),
    params.task ? '' : null,
    params.task ? `Follow-up task: ${params.task.note}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}
