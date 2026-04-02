import { z } from 'zod';

export type IntakeKind = 'profile_batch' | 'chat_batch' | 'unknown';

export interface ScreenshotAttachment {
  id: string;
  filename: string;
  path: string;
}

export interface IntakeJob {
  id: string;
  kind: IntakeKind;
  attachments: ScreenshotAttachment[];
  createdAt: string;
}

export const intakeKindSchema = z.enum(['profile_batch', 'chat_batch', 'unknown']);

export const screenshotAttachmentSchema = z.object({
  filename: z.string().min(1),
  path: z.string().min(1).optional(),
});

export const profilePayloadSchema = z.object({
  displayName: z.string().min(1),
  age: z.number().int().positive().max(99).optional(),
  location: z.string().min(1).optional(),
  bio: z.string().min(1).optional(),
  promptSet: z
    .array(
      z.object({
        prompt: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .default([]),
  photoNotes: z.array(z.string().min(1)).default([]),
  vibeTags: z.array(z.string().min(1)).default([]),
  redFlags: z.array(z.string().min(1)).default([]),
  extractionConfidence: z.number().min(0).max(1).default(0.7),
});

export const chatMessageInputSchema = z.object({
  direction: z.enum(['inbound', 'outbound']),
  body: z.string().min(1),
  confidence: z.number().min(0).max(1).default(0.8),
});

export const intakeRequestSchema = z
  .object({
    kind: intakeKindSchema,
    attachments: z.array(screenshotAttachmentSchema).default([]),
    profile: profilePayloadSchema.optional(),
    threadId: z.string().min(1).optional(),
    messages: z.array(chatMessageInputSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'profile_batch' && !value.profile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['profile'],
        message: 'profile is required for profile_batch intake',
      });
    }

    if (value.kind === 'chat_batch') {
      if (!value.threadId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['threadId'],
          message: 'threadId is required for chat_batch intake',
        });
      }
      if (value.messages.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['messages'],
          message: 'messages are required for chat_batch intake',
        });
      }
    }
  });

export type IntakeRequest = z.infer<typeof intakeRequestSchema>;
export type ProfilePayload = z.infer<typeof profilePayloadSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageInputSchema>;
