import { PrismaRepository } from './prisma-repository.js';
import type { Repository } from './repository.js';
import { InMemoryRepository } from './repository.js';

export function createRepository(): Repository {
  const provider = (process.env.PERSISTENCE_PROVIDER ?? 'memory').trim().toLowerCase();

  if (provider === 'prisma') {
    return new PrismaRepository();
  }

  return new InMemoryRepository();
}
