export type ExtractionKind = 'profile_batch' | 'chat_batch';

export interface ExtractionAttachmentInput {
  filename: string;
  path?: string;
  mimeType?: string;
}

export interface ExtractedPromptAnswer {
  prompt: string;
  answer: string;
}

export interface ExtractedMessage {
  direction: 'inbound' | 'outbound';
  body: string;
  confidence: number;
}

export interface ProfileExtractionResult {
  kind: 'profile_batch';
  displayName: string;
  age?: number;
  location?: string;
  bio?: string;
  promptSet: ExtractedPromptAnswer[];
  photoNotes: string[];
  vibeTags: string[];
  redFlags: string[];
  extractionConfidence: number;
  rawSummary?: string;
}

export interface ChatExtractionResult {
  kind: 'chat_batch';
  threadHint?: string;
  messages: ExtractedMessage[];
  extractionConfidence: number;
  rawSummary?: string;
}

export type ExtractionResult = ProfileExtractionResult | ChatExtractionResult;

export interface ExtractionAdapter {
  name: string;
  extract(input: {
    kind: ExtractionKind;
    attachments: ExtractionAttachmentInput[];
    instruction?: string;
  }): Promise<ExtractionResult>;
}
