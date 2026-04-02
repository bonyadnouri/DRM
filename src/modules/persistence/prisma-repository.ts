import { DraftStyleVariant, DraftType, MessageDirection, TaskPriority, TaskStatus, TaskType, ThreadStage, AttachmentSource, IntakeEventKind } from '@prisma/client';
import type { Attachment, Draft, IntakeEvent, Message, Profile, Task, Thread } from '../../domain/types.js';
import { prisma } from './prisma.js';
import type { Repository } from './repository.js';

export class PrismaRepository implements Repository {
  readonly name = 'prisma';

  async saveAttachments(attachments: Attachment[]): Promise<void> {
    if (attachments.length === 0) return;
    await prisma.attachment.createMany({
      data: attachments.map((attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        path: attachment.path,
        source: attachment.source === 'telegram_upload' ? AttachmentSource.telegram_upload : AttachmentSource.manual_test,
        sha256: attachment.sha256,
        createdAt: new Date(attachment.createdAt),
      })),
    });
  }

  async saveProfile(profile: Profile): Promise<void> {
    await prisma.profile.upsert({
      where: { id: profile.id },
      create: {
        id: profile.id,
        platform: profile.platform,
        displayName: profile.displayName,
        age: profile.age,
        location: profile.location,
        bio: profile.bio,
        promptSetJson: JSON.stringify(profile.promptSet),
        photoNotesJson: JSON.stringify(profile.photoNotes),
        vibeTagsJson: JSON.stringify(profile.vibeTags),
        redFlagsJson: JSON.stringify(profile.redFlags),
        extractionConfidence: profile.extractionConfidence,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
      },
      update: {
        platform: profile.platform,
        displayName: profile.displayName,
        age: profile.age,
        location: profile.location,
        bio: profile.bio,
        promptSetJson: JSON.stringify(profile.promptSet),
        photoNotesJson: JSON.stringify(profile.photoNotes),
        vibeTagsJson: JSON.stringify(profile.vibeTags),
        redFlagsJson: JSON.stringify(profile.redFlags),
        extractionConfidence: profile.extractionConfidence,
        updatedAt: new Date(profile.updatedAt),
      },
    });
  }

  async saveThread(thread: Thread): Promise<void> {
    await prisma.thread.upsert({
      where: { id: thread.id },
      create: {
        id: thread.id,
        profileId: thread.profileId,
        stage: mapThreadStage(thread.stage),
        nextGoal: thread.nextGoal,
        lastSummary: thread.lastSummary,
        followupDueAt: thread.followupDueAt ? new Date(thread.followupDueAt) : null,
        createdAt: new Date(thread.createdAt),
        updatedAt: new Date(thread.updatedAt),
      },
      update: {
        profileId: thread.profileId,
        stage: mapThreadStage(thread.stage),
        nextGoal: thread.nextGoal,
        lastSummary: thread.lastSummary,
        followupDueAt: thread.followupDueAt ? new Date(thread.followupDueAt) : null,
        updatedAt: new Date(thread.updatedAt),
      },
    });
  }

  async saveMessages(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;
    await prisma.message.createMany({
      data: messages.map((message) => ({
        id: message.id,
        threadId: message.threadId,
        direction: message.direction === 'inbound' ? MessageDirection.inbound : MessageDirection.outbound,
        body: message.body,
        confidence: message.confidence,
        createdAt: new Date(message.createdAt),
      })),
    });
  }

  async saveDrafts(drafts: Draft[]): Promise<void> {
    if (drafts.length === 0) return;
    await prisma.draft.createMany({
      data: drafts.map((draft) => ({
        id: draft.id,
        threadId: draft.threadId,
        type: mapDraftType(draft.type),
        styleVariant: mapDraftStyle(draft.styleVariant),
        body: draft.body,
        rationale: draft.rationale,
        createdAt: new Date(draft.createdAt),
      })),
    });
  }

  async saveTask(task: Task): Promise<void> {
    await prisma.task.upsert({
      where: { id: task.id },
      create: {
        id: task.id,
        threadId: task.threadId,
        type: mapTaskType(task.type),
        dueAt: task.dueAt ? new Date(task.dueAt) : null,
        priority: mapTaskPriority(task.priority),
        status: task.status === 'open' ? TaskStatus.open : TaskStatus.done,
        note: task.note,
        createdAt: new Date(task.createdAt),
      },
      update: {
        threadId: task.threadId,
        type: mapTaskType(task.type),
        dueAt: task.dueAt ? new Date(task.dueAt) : null,
        priority: mapTaskPriority(task.priority),
        status: task.status === 'open' ? TaskStatus.open : TaskStatus.done,
        note: task.note,
      },
    });
  }

  async saveEvent(event: IntakeEvent): Promise<void> {
    await prisma.intakeEvent.create({
      data: {
        id: event.id,
        intakeJobId: event.intakeJobId,
        kind: mapEventKind(event.kind),
        createdAt: new Date(event.createdAt),
        payloadJson: JSON.stringify(event.payload),
      },
    });
  }

  async listProfiles(): Promise<Profile[]> {
    const profiles = await prisma.profile.findMany({ orderBy: { createdAt: 'asc' } });
    return profiles.map((profile) => ({
      id: profile.id,
      platform: 'hinge',
      displayName: profile.displayName,
      age: profile.age ?? undefined,
      location: profile.location ?? undefined,
      bio: profile.bio ?? undefined,
      promptSet: JSON.parse(profile.promptSetJson),
      photoNotes: JSON.parse(profile.photoNotesJson),
      vibeTags: JSON.parse(profile.vibeTagsJson),
      redFlags: JSON.parse(profile.redFlagsJson),
      extractionConfidence: profile.extractionConfidence,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    }));
  }

  async getProfile(profileId: string): Promise<Profile | undefined> {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) return undefined;

    return {
      id: profile.id,
      platform: 'hinge',
      displayName: profile.displayName,
      age: profile.age ?? undefined,
      location: profile.location ?? undefined,
      bio: profile.bio ?? undefined,
      promptSet: JSON.parse(profile.promptSetJson),
      photoNotes: JSON.parse(profile.photoNotesJson),
      vibeTags: JSON.parse(profile.vibeTagsJson),
      redFlags: JSON.parse(profile.redFlagsJson),
      extractionConfidence: profile.extractionConfidence,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  async listThreads(): Promise<Thread[]> {
    const threads = await prisma.thread.findMany({ orderBy: { createdAt: 'asc' } });
    return threads.map((thread) => ({
      id: thread.id,
      profileId: thread.profileId,
      stage: thread.stage,
      nextGoal: thread.nextGoal ?? undefined,
      lastSummary: thread.lastSummary ?? undefined,
      followupDueAt: thread.followupDueAt?.toISOString(),
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    }));
  }

  async getThread(threadId: string): Promise<Thread | undefined> {
    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) return undefined;
    return {
      id: thread.id,
      profileId: thread.profileId,
      stage: thread.stage,
      nextGoal: thread.nextGoal ?? undefined,
      lastSummary: thread.lastSummary ?? undefined,
      followupDueAt: thread.followupDueAt?.toISOString(),
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    };
  }

  async listMessages(): Promise<Message[]> {
    const messages = await prisma.message.findMany({ orderBy: { createdAt: 'asc' } });
    return messages.map((message) => ({
      id: message.id,
      threadId: message.threadId,
      direction: message.direction,
      body: message.body,
      confidence: message.confidence,
      createdAt: message.createdAt.toISOString(),
    }));
  }

  async listDrafts(): Promise<Draft[]> {
    const drafts = await prisma.draft.findMany({ orderBy: { createdAt: 'asc' } });
    return drafts.map((draft) => ({
      id: draft.id,
      threadId: draft.threadId,
      type: draft.type,
      styleVariant: draft.styleVariant,
      body: draft.body,
      rationale: draft.rationale ?? undefined,
      createdAt: draft.createdAt.toISOString(),
    }));
  }

  async listTasks(): Promise<Task[]> {
    const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'asc' } });
    return tasks.map((task) => ({
      id: task.id,
      threadId: task.threadId,
      type: task.type,
      dueAt: task.dueAt?.toISOString(),
      priority: task.priority,
      status: task.status,
      note: task.note,
      createdAt: task.createdAt.toISOString(),
    }));
  }

  async listAttachments(): Promise<Attachment[]> {
    const attachments = await prisma.attachment.findMany({ orderBy: { createdAt: 'asc' } });
    return attachments.map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename,
      path: attachment.path,
      source: attachment.source,
      sha256: attachment.sha256 ?? undefined,
      createdAt: attachment.createdAt.toISOString(),
    }));
  }

  async listEvents(): Promise<IntakeEvent[]> {
    const events = await prisma.intakeEvent.findMany({ orderBy: { createdAt: 'asc' } });
    return events.map((event) => ({
      id: event.id,
      intakeJobId: event.intakeJobId,
      kind: event.kind,
      createdAt: event.createdAt.toISOString(),
      payload: JSON.parse(event.payloadJson),
    }));
  }
}

function mapThreadStage(value: Thread['stage']): ThreadStage {
  return value;
}

function mapDraftType(value: Draft['type']): DraftType {
  return value;
}

function mapDraftStyle(value: Draft['styleVariant']): DraftStyleVariant {
  return value;
}

function mapTaskType(value: Task['type']): TaskType {
  return value;
}

function mapTaskPriority(value: Task['priority']): TaskPriority {
  return value;
}

function mapEventKind(value: IntakeEvent['kind']): IntakeEventKind {
  return value;
}
