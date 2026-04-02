import type { Profile } from '../../domain/types.js';
import type { ProfilePayload } from '../../domain/intake.js';

export interface ProfileMatchCandidate {
  profileId: string;
  score: number;
  evidence: string[];
}

export interface ProfileMatchResult {
  decision: 'create_new' | 'attach_high_confidence' | 'attach_review';
  bestCandidate?: ProfileMatchCandidate;
  candidates: ProfileMatchCandidate[];
}

export function scoreProfileMatch(input: {
  incoming: ProfilePayload;
  existingProfiles: Profile[];
}): ProfileMatchResult {
  const candidates = input.existingProfiles
    .map<ProfileMatchCandidate>((profile) => {
      let score = 0;
      const evidence: string[] = [];

      if (normalize(profile.displayName) === normalize(input.incoming.displayName)) {
        score += 0.45;
        evidence.push('same display name');
      }

      if (profile.age && input.incoming.age && profile.age === input.incoming.age) {
        score += 0.2;
        evidence.push('same age');
      }

      if (profile.location && input.incoming.location && normalize(profile.location) === normalize(input.incoming.location)) {
        score += 0.15;
        evidence.push('same location');
      }

      const promptOverlap = overlap(
        profile.promptSet.flatMap((entry) => [entry.prompt, entry.answer]),
        input.incoming.promptSet.flatMap((entry) => [entry.prompt, entry.answer]),
      );
      if (promptOverlap > 0) {
        score += Math.min(0.2, promptOverlap * 0.05);
        evidence.push(`prompt overlap: ${promptOverlap}`);
      }

      return {
        profileId: profile.id,
        score: Number(score.toFixed(2)),
        evidence,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  const bestCandidate = candidates[0];

  if (!bestCandidate || bestCandidate.score < 0.55) {
    return {
      decision: 'create_new',
      candidates,
    };
  }

  if (bestCandidate.score >= 0.8) {
    return {
      decision: 'attach_high_confidence',
      bestCandidate,
      candidates,
    };
  }

  return {
    decision: 'attach_review',
    bestCandidate,
    candidates,
  };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function overlap(left: string[], right: string[]): number {
  const leftSet = new Set(left.map(normalize));
  const rightSet = new Set(right.map(normalize));
  let count = 0;
  for (const value of leftSet) {
    if (rightSet.has(value)) count += 1;
  }
  return count;
}
