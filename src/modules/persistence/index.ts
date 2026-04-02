import { PrismaRepository } from './prisma-repository.js';
import type { Repository } from './repository.js';
import { InMemoryRepository } from './repository.js';

export function createRepository(): Repository {
  const provider = (process.env.PERSISTENCE_PROVIDER ?? 'prisma').trim().toLowerCase();

  if (provider === 'memory') {
    return new InMemoryRepository();
  }

  return new PrismaRepository();
}
