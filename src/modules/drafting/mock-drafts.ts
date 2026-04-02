import type { Draft } from '../../domain/types.js';

export function mockOpenerDrafts(threadId: string, displayName: string): Draft[] {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      threadId,
      type: 'opener',
      styleVariant: 'recommended',
      body: `Okay ${displayName}, real question: are you actually this fun or is your profile just dangerously well-optimized? 😄`,
      rationale: 'Playful, observant, and easy to answer.',
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      threadId,
      type: 'opener',
      styleVariant: 'safe',
      body: `You seem like trouble in a fun way — what’s the story behind your most chaotic prompt answer?`,
      rationale: 'Low-risk, conversational, and profile-aware.',
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      threadId,
      type: 'opener',
      styleVariant: 'bold',
      body: `I was going to say something smooth, but honestly your profile already did most of the work. So what should I know first?`,
      rationale: 'Confident and direct without trying too hard.',
      createdAt: now,
    },
  ];
}

export function mockReplyDrafts(threadId: string, lastInbound: string): Draft[] {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      threadId,
      type: 'reply',
      styleVariant: 'recommended',
      body: `Hah, fair. ${softMirror(lastInbound)} What's the full story there?`,
      rationale: 'Acknowledges her message, keeps momentum, and invites detail.',
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      threadId,
      type: 'reply',
      styleVariant: 'playful',
      body: `That sounds suspiciously like the kind of thing that needs evidence 😄`,
      rationale: 'Light tease with an easy opening for her to continue.',
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      threadId,
      type: 'reply',
      styleVariant: 'safe',
      body: `Nice — I can work with that. How did that even happen?`,
      rationale: 'Short, calm, and keeps the convo moving.',
      createdAt: now,
    },
  ];
}

function softMirror(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return 'interesting';
  const first = trimmed.length > 40 ? `${trimmed.slice(0, 37)}...` : trimmed;
  return `"${first}"`; 
}
