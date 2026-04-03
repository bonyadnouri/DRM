import type { Message } from '../../domain/types.js';
import type { Repository } from '../persistence/repository.js';

export interface OperatorActionResult {
  threadId: string;
  message: Message;
  action: 'mark_sent' | 'mark_replied';
}

export async function markDraftSent(
  repository: Repository,
  params: { threadId: string; body: string },
): Promise<OperatorActionResult> {
  return createOutboundMessage(repository, params.threadId, params.body, 'mark_sent');
}

export async function markReplied(
  repository: Repository,
  params: { threadId: string; body: string },
): Promise<OperatorActionResult> {
  return createOutboundMessage(repository, params.threadId, params.body, 'mark_replied');
}

async function createOutboundMessage(
  repository: Repository,
  threadId: string,
  body: string,
  action: OperatorActionResult['action'],
): Promise<OperatorActionResult> {
  const thread = await repository.getThread(threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`);
  }

  const message: Message = {
    id: crypto.randomUUID(),
    threadId,
    direction: 'outbound',
    body,
    confidence: 1,
    createdAt: new Date().toISOString(),
  };

  await repository.saveMessages([message]);

  const updatedThread = {
    ...thread,
    stage: 'active' as const,
    lastSummary: `Latest outbound message logged: ${body}`,
    updatedAt: new Date().toISOString(),
  };

  await repository.saveThread(updatedThread);

  return {
    threadId,
    message,
    action,
  };
}
