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
- end-to-end extraction-to-intake demo endpoint: `POST /pipeline/profile-demo`
- optional real OpenAI vision extraction when `OPENAI_API_KEY` is present
- Telegram-style text presenter for operator-friendly output previews
- repository abstraction now wired into runtime intake writes
- repository-backed read models for state and thread inspection
- selectable persistence provider (`memory` or `prisma`)
- Prisma schema + local SQLite scaffold, now usable via `PERSISTENCE_PROVIDER=prisma`
- identity matching heuristics for profile linking
- `GET /state`, `GET /threads`, `GET /followups`, and `GET /health` for inspection

## Run locally
```bash
npm install
npm run dev
```

Optional: enable SQLite persistence instead of in-memory mode:
```bash
cp .env.example .env
npm run prisma:generate
npm run prisma:push
PERSISTENCE_PROVIDER=prisma npm run dev
```

Then test in another shell:
```bash
curl -X POST http://localhost:3000/extract/profile-demo
curl -X POST http://localhost:3000/pipeline/profile-demo
curl -X POST http://localhost:3000/intake/profile-demo
curl -X POST http://localhost:3000/intake/chat-demo
curl http://localhost:3000/threads
curl http://localhost:3000/followups
```

## Planned modules
- ingestion
- extraction
- identity resolution
- crm
- drafting
- reminders
- telegram interface
- persistence
