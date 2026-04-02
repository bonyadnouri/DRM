import type {
  Attachment,
  Draft,
  IntakeEvent,
  Message,
  Profile,
  Task,
  Thread,
} from '../../domain/types.js';

export const inMemoryStore: {
  profiles: Profile[];
  threads: Thread[];
  messages: Message[];
  drafts: Draft[];
  attachments: Attachment[];
  tasks: Task[];
  events: IntakeEvent[];
} = {
  profiles: [],
  threads: [],
  messages: [],
  drafts: [],
  attachments: [],
  tasks: [],
  events: [],
};
