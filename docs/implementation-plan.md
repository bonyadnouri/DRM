# Implementation Plan

## Objective
Ship a first usable Hinge Copilot CRM that accepts screenshot batches, builds conversation state, and returns operator-ready opener/reply suggestions via Telegram.

## Workstreams

### WS1 — Core backend scaffold
- finalize app structure
- environment config
- health endpoints
- module boundaries

### WS2 — Domain and persistence
- formal schema for profiles/threads/messages/drafts/attachments/tasks
- persistence choice and migrations
- event log

### WS3 — Intake pipeline
- screenshot batch intake contract
- attachment storage
- screenshot classification
- OCR/extraction abstraction
- normalized extraction output

### WS4 — Identity resolution
- profile matching heuristics
- thread linking logic
- confidence thresholds
- manual clarification flow

### WS5 — Drafting engine
- opener generation
- reply generation
- concise Telegram response formatting
- style profile hooks

### WS6 — Telegram operator UX
- batch upload flow
- quick summaries
- mark-sent flow
- queue/review commands
- reminders and CRM queries

### WS7 — Ops and reminders
- stale thread detection
- follow-up scheduler
- priority scoring
- reporting snapshots

## Recommended sequence
1. WS1
2. WS2
3. WS3
4. WS5 baseline
5. WS4
6. WS6
7. WS7

## First technical milestone
A local backend that can:
- accept a mocked screenshot batch payload
- persist a profile/thread/message skeleton
- return mocked opener/reply suggestions

## Current status
Done locally:
- Fastify app scaffold
- structured intake schema with validation
- in-memory storage for CRM state
- extracted intake orchestration into a dedicated service
- mocked profile-batch flow
- mocked chat-batch flow
- event log + follow-up task generation
- extraction adapter boundary for LLM/vision-based parsing
- optional OpenAI vision adapter behind the extraction interface
- extraction-to-intake pipeline demo path
- Telegram-friendly response formatting preview
- identity-resolution scoring heuristics for profile linking
- repository abstraction wired into runtime intake writes
- repository-backed state/thread/follow-up reads
- Prisma schema and local SQLite scaffold
- selectable runtime persistence provider (`memory` or `prisma`)
- state inspection endpoints

## Product/technical decision
For MVP extraction, use an LLM vision adapter instead of building a separate OCR stack first.
Reasoning:
- lower implementation friction
- likely good enough for screenshot batches
- one interface can later swap between OpenAI / Gemini / Claude / dedicated OCR if needed

## Important implementation note
Prisma 7 caused config friction for the simple local SQLite setup, so the project was pinned back to Prisma 6.x for smoother MVP iteration.

## Next milestone
Telegram-integrated intake with attachment persistence and operator-readable outputs.

## Immediate next build steps
1. Add a real chat extraction pipeline path with thread resolution instead of demo thread hints.
2. Add Telegram command/webhook adapter and message formatting.
3. Expand operator query endpoints/commands (`who needs replies?`, `show stale threads`, profile lookup).
4. Add state transitions for `mark sent`, `draft used`, and `thread closed`.
5. Add scheduled stale-thread reporting.
