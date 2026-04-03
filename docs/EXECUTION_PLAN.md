# Hinge Copilot CRM — Execution Plan

## Goal
Build a Telegram-first Hinge Copilot CRM that turns screenshot batches into structured dating CRM state, generates opener/reply drafts, and gives the operator a low-friction review workflow.

This document is the working execution plan for implementation. It is intentionally practical and stepwise, not aspirational.

---

## Product goal
The operator should be able to:
1. send screenshots of Hinge profiles or chats
2. have them parsed into structured data
3. see the correct profile/thread state
4. receive suggested openers or replies
5. keep track of follow-ups and active conversations

---

## Current state
Already implemented:
- Fastify backend scaffold
- domain schema for profiles, threads, messages, drafts, tasks, events
- in-memory repository flow
- mocked drafting
- identity matching heuristics
- extraction adapter abstraction
- mock LLM extraction
- optional OpenAI vision extraction adapter
- Prisma schema + local SQLite scaffold
- recurring Telegram-side progress updates
- Git repo initialized and connected to GitHub

Current weakness:
- persistence is scaffolded but not the true active source of runtime state
- extraction pipeline is only partially live
- Telegram ingestion is not yet implemented
- operator actions are not yet modeled end-to-end

---

## Working principle
Implementation should proceed in vertical slices.
Each slice must:
1. change the code
2. be tested locally
3. be committed
4. be reported to the user with concrete artifacts

No vague status updates.
Only report real completed steps.

---

## Step plan

### Step 1 — Establish source-of-truth execution plan
Deliverable:
- this execution plan document committed to repo

Success criteria:
- plan reflects actual current codebase
- next implementation steps are concrete and ordered

### Step 2 — Make persistence a first-class runtime path
Deliverable:
- runtime selects repository explicitly
- Prisma repository completes missing write/read operations required for active flow
- app can run against SQLite without relying on in-memory state as source of truth

Success criteria:
- profile intake persists to DB
- chat intake persists to DB
- thread listing can be loaded from DB-backed queries

### Step 3 — Add query service backed by repository
Deliverable:
- thread/profile query service no longer depends on raw in-memory state
- inspection endpoints operate through service abstraction

Success criteria:
- `/threads` and related views work using persisted data
- active state survives process restarts when using Prisma path

### Step 4 — Turn extraction pipeline into a real runtime path
Deliverable:
- extraction result maps into persisted intake flow
- profile and chat pipeline demo endpoints use the same orchestration path

Success criteria:
- one endpoint path handles extract -> normalize -> persist -> draft
- mock and OpenAI adapters are swappable without route changes

Status: completed through sub-steps 4a-4d
- 4a: `pipeline/chat-demo`
- 4b: shared extraction/intake orchestration refactor
- 4c: extraction normalization and fallback handling
- 4d: manual test checklist and runtime-path documentation

### Step 5 — Add operator actions/state transitions
Deliverable:
- endpoints or service actions for: mark sent, mark replied, close thread, reopen thread, schedule follow-up

Success criteria:
- thread state can evolve intentionally
- reminders/tasks reflect actual operator actions

Status: completed through sub-steps 5a-5d
- 5a: thread state transitions
- 5b: draft/message operator actions
- 5c: follow-up task actions
- 5d: action endpoint documentation + manual test flow updates

### Step 6 — Telegram-facing operator interface
Deliverable:
- Telegram-oriented ingestion/command layer design and first implementation pass
- operator-readable response formatting for new profiles and chat replies

Success criteria:
- a minimal real Telegram flow becomes possible
- user can submit inputs and get structured outputs without manual curl-only workflow

Status: Step 6 completed through sub-steps 6a-6e
- 6a: Telegram operator contract
- 6b: Telegram response formatting layer
- 6c: Telegram command routing abstraction
- 6d: minimal Telegram command handling path
- 6e: Telegram test flow + docs

### Step 7 — Hardening and first realistic test pass
Deliverable:
- local end-to-end test checklist
- bugfixes found during realistic testing
- cleanup of obvious scaffolding debt

Success criteria:
- first realistic manual test path works cleanly
- results are understandable and inspectable

---

## Immediate next step
Do Step 2 now:
**Make persistence the first-class runtime path.**

Reason:
Everything else becomes cleaner once the app stops pretending in-memory state is the real backend.

---

## Reporting rule
After each completed step:
- run the relevant checks/tests
- create a git commit
- send the user a concise message with:
  - what was done
  - what passed
  - commit hash / commit message
  - what next step starts now

If blocked:
- describe the concrete blocker
- do not fake progress
