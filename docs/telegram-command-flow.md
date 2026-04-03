# Telegram Command Flow (Current Minimal Path)

## Goal
Document the currently implemented minimal Telegram-oriented command flow.

## What exists today
The current command flow is internal, but real enough to be treated as the first Telegram-facing runtime path.

### Layer 1 — Command contract
Documented in:
- `docs/telegram-operator-contract.md`

### Layer 2 — Command parsing
Implemented in:
- `src/modules/telegram/command-router.ts`

Responsibility:
- turn Telegram-like text commands into structured command objects

### Layer 3 — Command handling
Implemented in:
- `src/modules/telegram/command-handler.ts`

Responsibility:
- map parsed commands onto repository-backed reads or action services

### Layer 4 — Telegram response formatting
Implemented in:
- `src/modules/telegram/presenter.ts`

Responsibility:
- convert internal results into concise operator-facing Telegram text

---

## Currently covered command family
- `/followups`
- `/threads`
- `/thread <threadId>`
- `/close <threadId>`
- `/reopen <threadId>`
- `/stage <threadId> <stage>`
- `/mark-sent <threadId> <text>`
- `/mark-replied <threadId> <text>`
- `/followup <threadId> <note>`

---

## Flow shape
1. operator sends Telegram-style text command
2. `parseTelegramCommand(...)` converts it into a typed command object
3. `handleTelegramCommand(...)` maps it to query/action logic
4. presenter formats the reply text
5. resulting text is ready for eventual Telegram delivery

---

## What is still missing
- real inbound Telegram message adapter / webhook flow
- screenshot/media ingestion from Telegram
- inline buttons / richer UX
- command auth / multi-operator handling

---

## Why this counts as Step 6d complete
The project now has a minimal but real Telegram-oriented command runtime path inside the codebase.
That satisfies the goal of creating a first inbound-adjacent integration layer without yet implementing the full external Telegram adapter.
