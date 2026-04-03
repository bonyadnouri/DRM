# Hinge Copilot CRM

Telegram-first Hinge copilot that turns screenshot batches into a structured CRM, drafts openers/replies, and helps manage many parallel conversations with minimal user friction.

## Current focus
- Product spec in `docs/hinge-copilot-spec.md`
- MVP-first, modular monolith
- Screenshot intake -> OCR/extraction -> identity resolution -> CRM -> draft generation

## Working principle
Bonyad keeps swiping and taking screenshots on the phone.
The tool should make everything after that as easy as possible.

## What works right now
A local testable MVP scaffold with:
- Fastify server
- `POST /intake` for structured local intake simulation
- `POST /intake/profile-demo` for a mocked new-profile flow
- `POST /intake/chat-demo` for a mocked ongoing-chat flow
- extraction adapter boundary for LLM/vision-based screenshot parsing
- demo extraction endpoints: `POST /extract/profile-demo` and `POST /extract/chat-demo`
- end-to-end extraction-to-intake demo endpoints: `POST /pipeline/profile-demo` and `POST /pipeline/chat-demo`
- shared extraction-to-intake orchestration module for both profile and chat paths
- normalized extraction outputs before intake persistence, with fallbacks for incomplete LLM output
- optional real OpenAI vision extraction when `OPENAI_API_KEY` is present
- Telegram-style text presenter for operator-friendly output previews
- repository abstraction now wired into runtime intake writes
- repository-backed read models for state and thread inspection
- selectable persistence provider (`memory` or `prisma`)
- Prisma schema + local SQLite scaffold, now usable via `PERSISTENCE_PROVIDER=prisma`
- identity matching heuristics for profile linking
- `GET /state`, `GET /threads`, `GET /followups`, and `GET /health` for inspection
- thread state transition endpoints:
  - `POST /threads/:threadId/close`
  - `POST /threads/:threadId/reopen`
  - `POST /threads/:threadId/stage`
- operator message action endpoints:
  - `POST /threads/:threadId/mark-sent`
  - `POST /threads/:threadId/mark-replied`
- follow-up task action endpoints:
  - `POST /tasks/:taskId/done`
  - `POST /tasks/:taskId/reschedule`
  - `POST /threads/:threadId/followups`

## Run locally
```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:push
npm run dev
```

By default the app now uses the Prisma-backed SQLite repository.
If you want the older in-memory mode for debugging:
```bash
PERSISTENCE_PROVIDER=memory npm run dev
```

Then test in another shell:
```bash
curl -X POST http://localhost:3000/extract/profile-demo
curl -X POST http://localhost:3000/pipeline/profile-demo
curl -X POST http://localhost:3000/pipeline/chat-demo
curl -X POST http://localhost:3000/intake/profile-demo
curl -X POST http://localhost:3000/intake/chat-demo
curl http://localhost:3000/threads
curl http://localhost:3000/followups
```

For a fuller local verification flow, use:
- `docs/manual-test-checklist.md`
- includes thread state transitions, outbound action logging, and follow-up task actions

## Planned modules
- ingestion
- extraction
- identity resolution
- crm
- drafting
- reminders
- telegram interface
- persistence

## Telegram operator flow
Initial Telegram operator contract is documented in:
- `docs/telegram-operator-contract.md`

Current minimal Telegram command flow is documented in:
- `docs/telegram-command-flow.md`

Telegram presentation helpers now cover:
- profile results
- chat results
- follow-up lists
- thread detail views
- action confirmations

Telegram command parsing now recognizes:
- `/followups`
- `/threads`
- `/thread <threadId>`
- `/close <threadId>`
- `/reopen <threadId>`
- `/stage <threadId> <stage>`
- `/mark-sent <threadId> <text>`
- `/mark-replied <threadId> <text>`
- `/followup <threadId> <note>`

Minimal Telegram command handling abstraction now supports:
- `/followups`
- `/threads`
- `/thread <threadId>`
- `/close <threadId>`
- `/reopen <threadId>`
- `/stage <threadId> <stage>`
- `/mark-sent <threadId> <text>`
- `/mark-replied <threadId> <text>`
- `/followup <threadId> <note>`
