import type {
  ChatExtractionResult,
  ExtractionAdapter,
  ProfileExtractionResult,
} from './adapter.js';

interface OpenAiMessageResponse {
  output_text?: string;
}

export class OpenAiVisionExtractionAdapter implements ExtractionAdapter {
  name = 'openai-vision';

  async extract(input: {
    kind: 'profile_batch' | 'chat_batch';
    attachments: Array<{ filename: string; path?: string; mimeType?: string }>;
    instruction?: string;
  }): Promise<ProfileExtractionResult | ChatExtractionResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const content = await Promise.all(
      input.attachments.map(async (attachment) => ({
        type: 'input_image' as const,
        image_url: await toDataUrl(attachment.path),
      })),
    );

    const systemPrompt =
      input.kind === 'profile_batch'
        ? `You extract structured data from dating app profile screenshots. Return strict JSON with keys: kind, displayName, age, location, bio, promptSet, photoNotes, vibeTags, redFlags, extractionConfidence, rawSummary.`
        : `You extract structured data from dating app chat screenshots. Return strict JSON with keys: kind, threadHint, messages, extractionConfidence, rawSummary. Each message must have direction, body, confidence.`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: systemPrompt }],
          },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: input.instruction ?? 'Extract the screenshots into structured JSON.' },
              ...content,
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI extraction failed: ${response.status} ${errorText}`);
    }

    const json = (await response.json()) as OpenAiMessageResponse;
    const text = json.output_text;
    if (!text) {
      throw new Error('OpenAI extraction returned no output_text');
    }

    return JSON.parse(text) as ProfileExtractionResult | ChatExtractionResult;
  }
}

async function toDataUrl(filePath?: string): Promise<string> {
  if (!filePath) {
    throw new Error('Attachment path is required for OpenAI vision extraction');
  }

  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const buffer = await fs.readFile(path.resolve(filePath));
  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg';

  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
