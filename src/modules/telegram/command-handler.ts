import { listOpenFollowups, listThreadViews } from '../crm/query-service.js';
import { markDraftSent, markReplied } from '../intake/operator-actions.js';
import { createFollowupTask } from '../intake/task-actions.js';
import { closeThread, reopenThread, setThreadStage } from '../intake/thread-actions.js';
import type { Repository } from '../persistence/repository.js';
import {
  formatActionConfirmation,
  formatFollowupList,
  formatThreadDetail,
} from './presenter.js';
import type { TelegramCommand } from './command-router.js';

export async function handleTelegramCommand(repository: Repository, command: TelegramCommand): Promise<string> {
  switch (command.kind) {
    case 'followups': {
      const followups = await listOpenFollowups(repository);
      return formatFollowupList(followups);
    }

    case 'threads': {
      const threadViews = await listThreadViews(repository);
      if (threadViews.length === 0) {
        return 'No threads yet.';
      }

      return [
        'Threads:',
        ...threadViews.slice(0, 10).map((thread) => {
          const profileName = thread.profile?.displayName ?? 'Unknown';
          return `- ${thread.id} • ${profileName} • ${thread.stage}`;
        }),
      ].join('\n');
    }

    case 'thread': {
      const threadViews = await listThreadViews(repository);
      const thread = threadViews.find((candidate) => candidate.id === command.threadId);
      if (!thread) {
        return `Thread not found: ${command.threadId}`;
      }

      return formatThreadDetail(thread);
    }

    case 'close': {
      const result = await closeThread(repository, command.threadId);
      return formatActionConfirmation({
        target: 'thread',
        id: result.thread.id,
        action: 'close',
        detail: `New stage: ${result.thread.stage}`,
      });
    }

    case 'reopen': {
      const result = await reopenThread(repository, command.threadId);
      return formatActionConfirmation({
        target: 'thread',
        id: result.thread.id,
        action: 'reopen',
        detail: `New stage: ${result.thread.stage}`,
      });
    }

    case 'stage': {
      const result = await setThreadStage(repository, command.threadId, command.stage);
      return formatActionConfirmation({
        target: 'thread',
        id: result.thread.id,
        action: `set_stage:${command.stage}`,
        detail: `New stage: ${result.thread.stage}`,
      });
    }

    case 'mark_sent': {
      const result = await markDraftSent(repository, {
        threadId: command.threadId,
        body: command.body,
      });
      return formatActionConfirmation({
        target: 'message',
        id: result.message.id,
        action: 'mark_sent',
        detail: `Thread: ${result.threadId}`,
      });
    }

    case 'mark_replied': {
      const result = await markReplied(repository, {
        threadId: command.threadId,
        body: command.body,
      });
      return formatActionConfirmation({
        target: 'message',
        id: result.message.id,
        action: 'mark_replied',
        detail: `Thread: ${result.threadId}`,
      });
    }

    case 'followup': {
      const result = await createFollowupTask(repository, {
        threadId: command.threadId,
        note: command.note,
      });
      return formatActionConfirmation({
        target: 'task',
        id: result.task.id,
        action: 'create_followup',
        detail: `Thread: ${result.task.threadId}`,
      });
    }

    default:
      return 'Command recognized but not handled yet in minimal Telegram handler.';
  }
}
