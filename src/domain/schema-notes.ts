export const schemaNotes = {
  profile: [
    'displayName',
    'age',
    'location',
    'bio',
    'promptSet',
    'photoNotes',
    'vibeTags',
    'redFlags',
    'extractionConfidence',
  ],
  thread: [
    'profileId',
    'stage',
    'nextGoal',
    'lastSummary',
    'followupDueAt',
  ],
  message: [
    'threadId',
    'direction',
    'body',
    'confidence',
  ],
  draft: [
    'threadId',
    'type',
    'styleVariant',
    'body',
    'rationale',
  ],
  attachment: [
    'filename',
    'path',
    'sha256',
    'source',
  ],
};
