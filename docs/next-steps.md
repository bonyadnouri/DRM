# Next Steps

## Current state
The project now has:
- local Fastify MVP server
- structured intake validation
- selectable repository-backed CRM flow (`memory` or `prisma`)
- identity matching heuristics
- extraction adapter boundary
- mock LLM extraction
- optional OpenAI vision extraction adapter
- Prisma schema + local SQLite database scaffold
- Telegram-oriented result formatting
- repository-backed read endpoints for state/thread inspection
- follow-up query endpoint for operator review

## Recommended next implementation sequence
1. Wire Telegram inbound attachments to the extraction pipeline.
2. Add approval/state transition endpoints (`mark sent`, `save draft used`, `close thread`).
3. Expand operator query endpoints beyond follow-ups (`who needs replies?`, profile lookup, stale threads).
4. Add scheduled stale-thread reporting.
5. Persist raw attachment metadata/hashes during real Telegram intake.

## Product decisions currently encoded
- MVP prefers LLM vision extraction over a dedicated OCR stack.
- Human remains in the loop for outbound messages.
- Telegram is the primary operator interface.
- Fast local iteration beats premature automation.

## Open blockers / caveats
- Real OpenAI extraction requires `OPENAI_API_KEY` and reachable image file paths.
- Prisma persistence now works when `PERSISTENCE_PROVIDER=prisma`, but the default is still in-memory for frictionless local iteration.
- Current Telegram layer is only a presenter, not a real inbound bot/webhook integration.
