import Fastify from 'fastify';
import { z } from 'zod';
import { intakeRequestSchema } from './domain/intake.js';
import {
  getRepositoryCounts,
  getRepositoryState,
  listOpenFollowups,
  listThreadViews,
} from './modules/crm/query-service.js';
import { createExtractionAdapter } from './modules/extraction/index.js';
import { processExtractedIntake } from './modules/intake/extraction-intake.js';
import { ensureDemoThread, processIntake } from './modules/intake/service.js';
import { closeThread, reopenThread, setThreadStage } from './modules/intake/thread-actions.js';
import { markDraftSent, markReplied } from './modules/intake/operator-actions.js';
import { createFollowupTask, markTaskDone, rescheduleTask } from './modules/intake/task-actions.js';
import { createRepository } from './modules/persistence/index.js';
import { formatChatResult, formatProfileResult } from './modules/telegram/presenter.js';

const app = Fastify({ logger: true });
const extractionAdapter = createExtractionAdapter();
const repository = createRepository();

app.get('/health', async () => {
  const counts = await getRepositoryCounts(repository);

  return {
    ok: true,
    service: 'hinge-copilot-crm',
    stage: 'mvp-local',
    extractionAdapter: extractionAdapter.name,
    persistenceProvider: repository.name,
    counts,
  };
});

app.get('/', async () => {
  return {
    name: 'Hinge Copilot CRM',
    message:
      'Local MVP is up. Use /intake/* demo endpoints, /extract/* demo endpoints, or /pipeline/profile-demo.',
  };
});

app.get('/state', async () => {
  return getRepositoryState(repository);
});

app.get('/threads', async () => {
  return listThreadViews(repository);
});

app.get('/followups', async () => {
  return listOpenFollowups(repository);
});

app.post('/intake', async (request, reply) => {
  const parsed = intakeRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.code(400).send({
      ok: false,
      error: 'invalid_intake_request',
      issues: parsed.error.issues,
    });
  }

  const result = await processIntake(parsed.data, repository);
  return reply.code(201).send({ ok: true, result });
});

app.post('/intake/profile-demo', async (_request, reply) => {
  const result = await processIntake(
    {
      kind: 'profile_batch',
      attachments: [
        { filename: 'profile-1.png', path: 'fixtures/profile-1.png' },
        { filename: 'profile-2.png', path: 'fixtures/profile-2.png' },
      ],
      profile: {
        displayName: 'Mila',
        age: 27,
        location: 'Berlin',
        bio: 'Consultant, padel addict, and elite overthinker.',
        promptSet: [
          {
            prompt: 'My simple pleasures',
            answer: 'airport bookstores and iced matcha',
          },
          {
            prompt: 'Together we could',
            answer: 'win a pub quiz or embarrass ourselves trying',
          },
        ],
        photoNotes: ['smiling portrait', 'padel court photo', 'rooftop dinner'],
        vibeTags: ['witty', 'active', 'social'],
        redFlags: [],
        extractionConfidence: 0.93,
      },
      messages: [],
    },
    repository,
  );

  return reply.code(201).send({
    ok: true,
    result,
    telegramPreview:
      result.profile && result.thread && result.summary && result.drafts
        ? formatProfileResult({
            profile: result.profile,
            thread: result.thread,
            summary: result.summary,
            drafts: result.drafts,
          })
        : null,
  });
});

app.post('/intake/chat-demo', async (_request, reply) => {
  const existingThread = await ensureDemoThread(repository);
  const result = await processIntake(
    {
      kind: 'chat_batch',
      threadId: existingThread.id,
      attachments: [{ filename: 'chat-1.png', path: 'fixtures/chat-1.png' }],
      messages: [
        {
          direction: 'inbound',
          body: 'Hahaha okay fair, but only if you can keep up at padel.',
          confidence: 0.94,
        },
      ],
    },
    repository,
  );

  return reply.code(201).send({
    ok: true,
    result,
    telegramPreview:
      result.profile && result.thread && result.summary && result.drafts
        ? formatChatResult({
            profileName: result.profile.displayName,
            thread: result.thread,
            summary: result.summary,
            drafts: result.drafts,
            task: result.task,
          })
        : null,
  });
});

app.post('/extract/profile-demo', async (_request, reply) => {
  const attachments = [
    { filename: 'profile-1.png', path: 'fixtures/profile-1.png' },
    { filename: 'profile-2.png', path: 'fixtures/profile-2.png' },
  ];

  const extraction = await extractionAdapter.extract({
    kind: 'profile_batch',
    attachments,
    instruction: 'Extract a Hinge profile into structured fields.',
  });

  return reply.code(200).send({ ok: true, extraction });
});

app.post('/extract/chat-demo', async (_request, reply) => {
  const attachments = [{ filename: 'chat-1.png', path: 'fixtures/chat-1.png' }];

  const extraction = await extractionAdapter.extract({
    kind: 'chat_batch',
    attachments,
    instruction: 'Extract a Hinge chat screenshot batch into normalized messages.',
  });

  return reply.code(200).send({ ok: true, extraction });
});

app.post('/pipeline/profile-demo', async (_request, reply) => {
  const attachments = [
    { filename: 'profile-1.png', path: 'fixtures/profile-1.png' },
    { filename: 'profile-2.png', path: 'fixtures/profile-2.png' },
  ];

  const pipeline = await processExtractedIntake({
    kind: 'profile_batch',
    attachments,
    extractionAdapter,
    repository,
  });

  return reply.code(200).send({
    ok: true,
    ...pipeline,
    telegramPreview:
      pipeline.result.profile && pipeline.result.thread && pipeline.result.summary && pipeline.result.drafts
        ? formatProfileResult({
            profile: pipeline.result.profile,
            thread: pipeline.result.thread,
            summary: pipeline.result.summary,
            drafts: pipeline.result.drafts,
          })
        : null,
  });
});

app.post('/pipeline/chat-demo', async (_request, reply) => {
  const attachments = [{ filename: 'chat-1.png', path: 'fixtures/chat-1.png' }];

  const pipeline = await processExtractedIntake({
    kind: 'chat_batch',
    attachments,
    extractionAdapter,
    repository,
  });

  return reply.code(200).send({
    ok: true,
    ...pipeline,
    telegramPreview:
      pipeline.result.profile && pipeline.result.thread && pipeline.result.summary && pipeline.result.drafts
        ? formatChatResult({
            profileName: pipeline.result.profile.displayName,
            thread: pipeline.result.thread,
            summary: pipeline.result.summary,
            drafts: pipeline.result.drafts,
            task: pipeline.result.task,
          })
        : null,
  });
});

const threadStageSchema = z.object({
  stage: z.enum(['new', 'opened', 'active', 'followup_needed', 'close_candidate', 'closed']),
});

const outboundMessageSchema = z.object({
  body: z.string().min(1),
});

const taskRescheduleSchema = z.object({
  dueAt: z.string().min(1),
});

const createFollowupSchema = z.object({
  note: z.string().min(1),
  dueAt: z.string().min(1).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

app.post('/threads/:threadId/close', async (request, reply) => {
  try {
    const result = await closeThread(repository, (request.params as { threadId: string }).threadId);
    return reply.code(200).send({ ok: true, result });
  } catch (error) {
    return reply.code(404).send({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' });
  }
});

app.post('/threads/:threadId/reopen', async (request, reply) => {
  try {
    const result = await reopenThread(repository, (request.params as { threadId: string }).threadId);
    return reply.code(200).send({ ok: true, result });
  } catch (error) {
    return reply.code(404).send({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' });
  }
});

app.post('/threads/:threadId/stage', async (request, reply) => {
  const parsed = threadStageSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, error: 'invalid_stage_payload', issues: parsed.error.issues });
  }

  try {
    const result = await setThreadStage(
      repository,
      (request.params as { threadId: string }).threadId,
      parsed.data.stage,
    );
    return reply.code(200).send({ ok: true, result });
  } catch (error) {
    return reply.code(404).send({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' });
  }
});

app.post('/threads/:threadId/mark-sent', async (request, reply) => {
  const parsed = outboundMessageSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, error: 'invalid_outbound_payload', issues: parsed.error.issues });
  }

  try {
    const result = await markDraftSent(repository, {
      threadId: (request.params as { threadId: string }).threadId,
      body: parsed.data.body,
    });
    return reply.code(200).send({ ok: true, result });
  } catch (error) {
    return reply.code(404).send({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' });
  }
});

app.post('/threads/:threadId/mark-replied', async (request, reply) => {
  const parsed = outboundMessageSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, error: 'invalid_outbound_payload', issues: parsed.error.issues });
  }

  try {
    const result = await markReplied(repository, {
      threadId: (request.params as { threadId: string }).threadId,
      body: parsed.data.body,
    });
    return reply.code(200).send({ ok: true, result });
  } catch (error) {
    return reply.code(404).send({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' });
  }
});

app.post('/tasks/:taskId/done', async (request, reply) => {
  try {
    const result = await markTaskDone(repository, (request.params as { taskId: string }).taskId);
    return reply.code(200).send({ ok: true, result });
  } catch (error) {
    return reply.code(404).send({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' });
  }
});

app.post('/tasks/:taskId/reschedule', async (request, reply) => {
  const parsed = taskRescheduleSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, error: 'invalid_reschedule_payload', issues: parsed.error.issues });
  }

  try {
    const result = await rescheduleTask(repository, {
      taskId: (request.params as { taskId: string }).taskId,
      dueAt: parsed.data.dueAt,
    });
    return reply.code(200).send({ ok: true, result });
  } catch (error) {
    return reply.code(404).send({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' });
  }
});

app.post('/threads/:threadId/followups', async (request, reply) => {
  const parsed = createFollowupSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, error: 'invalid_followup_payload', issues: parsed.error.issues });
  }

  try {
    const result = await createFollowupTask(repository, {
      threadId: (request.params as { threadId: string }).threadId,
      note: parsed.data.note,
      dueAt: parsed.data.dueAt,
      priority: parsed.data.priority,
    });
    return reply.code(200).send({ ok: true, result });
  } catch (error) {
    return reply.code(404).send({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' });
  }
});

const port = Number(process.env.PORT || 3000);

try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
