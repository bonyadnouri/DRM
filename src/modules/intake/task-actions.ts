import type { Task } from '../../domain/types.js';
import type { Repository } from '../persistence/repository.js';

export interface TaskActionResult {
  task: Task;
  action: 'mark_done' | 'reschedule' | 'create_followup';
}

export async function markTaskDone(repository: Repository, taskId: string): Promise<TaskActionResult> {
  const task = await getTask(repository, taskId);
  const updatedTask: Task = {
    ...task,
    status: 'done',
  };

  await repository.saveTask(updatedTask);
  return { task: updatedTask, action: 'mark_done' };
}

export async function rescheduleTask(
  repository: Repository,
  params: { taskId: string; dueAt: string },
): Promise<TaskActionResult> {
  const task = await getTask(repository, params.taskId);
  const updatedTask: Task = {
    ...task,
    dueAt: params.dueAt,
    status: 'open',
  };

  await repository.saveTask(updatedTask);
  return { task: updatedTask, action: 'reschedule' };
}

export async function createFollowupTask(
  repository: Repository,
  params: { threadId: string; note: string; dueAt?: string; priority?: Task['priority'] },
): Promise<TaskActionResult> {
  const thread = await repository.getThread(params.threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${params.threadId}`);
  }

  const task: Task = {
    id: crypto.randomUUID(),
    threadId: params.threadId,
    type: 'followup',
    dueAt: params.dueAt,
    priority: params.priority ?? 'medium',
    status: 'open',
    note: params.note,
    createdAt: new Date().toISOString(),
  };

  await repository.saveTask(task);
  return { task, action: 'create_followup' };
}

async function getTask(repository: Repository, taskId: string): Promise<Task> {
  const tasks = await repository.listTasks();
  const task = tasks.find((candidate) => candidate.id === taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  return task;
}
