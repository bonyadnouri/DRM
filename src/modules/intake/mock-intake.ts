import type { IntakeJob, IntakeKind } from '../../domain/intake.js';

export function createMockIntake(kind: IntakeKind): IntakeJob {
  return {
    id: crypto.randomUUID(),
    kind,
    attachments: [],
    createdAt: new Date().toISOString(),
  };
}
