import type { ThreadStage } from '../../domain/types.js';

export type TelegramCommand =
  | { kind: 'followups' }
  | { kind: 'threads' }
  | { kind: 'thread'; threadId: string }
  | { kind: 'close'; threadId: string }
  | { kind: 'reopen'; threadId: string }
  | { kind: 'stage'; threadId: string; stage: ThreadStage }
  | { kind: 'mark_sent'; threadId: string; body: string }
  | { kind: 'mark_replied'; threadId: string; body: string }
  | { kind: 'followup'; threadId: string; note: string };

const allowedStages: ThreadStage[] = [
  'new',
  'opened',
  'active',
  'followup_needed',
  'close_candidate',
  'closed',
];

export function parseTelegramCommand(input: string): TelegramCommand | null {
  const text = input.trim();
  if (!text.startsWith('/')) return null;

  const [rawCommand, ...rest] = text.split(' ');
  const command = rawCommand.toLowerCase();

  if (command === '/followups') {
    return { kind: 'followups' };
  }

  if (command === '/threads') {
    return { kind: 'threads' };
  }

  if (command === '/thread' && rest[0]) {
    return { kind: 'thread', threadId: rest[0] };
  }

  if (command === '/close' && rest[0]) {
    return { kind: 'close', threadId: rest[0] };
  }

  if (command === '/reopen' && rest[0]) {
    return { kind: 'reopen', threadId: rest[0] };
  }

  if (command === '/stage' && rest[0] && rest[1] && isThreadStage(rest[1])) {
    return { kind: 'stage', threadId: rest[0], stage: rest[1] };
  }

  if (command === '/mark-sent' && rest[0] && rest.length > 1) {
    return {
      kind: 'mark_sent',
      threadId: rest[0],
      body: rest.slice(1).join(' ').trim(),
    };
  }

  if (command === '/mark-replied' && rest[0] && rest.length > 1) {
    return {
      kind: 'mark_replied',
      threadId: rest[0],
      body: rest.slice(1).join(' ').trim(),
    };
  }

  if (command === '/followup' && rest[0] && rest.length > 1) {
    return {
      kind: 'followup',
      threadId: rest[0],
      note: rest.slice(1).join(' ').trim(),
    };
  }

  return null;
}

function isThreadStage(value: string): value is ThreadStage {
  return allowedStages.includes(value as ThreadStage);
}
