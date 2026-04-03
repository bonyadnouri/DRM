import type { Thread, ThreadStage } from '../../domain/types.js';
import type { Repository } from '../persistence/repository.js';

export interface ThreadActionResult {
  thread: Thread;
  action: 'close' | 'reopen' | 'set_stage';
}

export async function closeThread(repository: Repository, threadId: string): Promise<ThreadActionResult> {
  return updateThreadStage(repository, threadId, 'closed', 'close');
}

export async function reopenThread(repository: Repository, threadId: string): Promise<ThreadActionResult> {
  return updateThreadStage(repository, threadId, 'active', 'reopen');
}

export async function setThreadStage(
  repository: Repository,
  threadId: string,
  stage: ThreadStage,
): Promise<ThreadActionResult> {
  return updateThreadStage(repository, threadId, stage, 'set_stage');
}

async function updateThreadStage(
  repository: Repository,
  threadId: string,
  stage: ThreadStage,
  action: ThreadActionResult['action'],
): Promise<ThreadActionResult> {
  const thread = await repository.getThread(threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`);
  }

  const updatedThread: Thread = {
    ...thread,
    stage,
    updatedAt: new Date().toISOString(),
  };

  await repository.saveThread(updatedThread);

  return {
    thread: updatedThread,
    action,
  };
}
