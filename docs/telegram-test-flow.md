# Telegram Test Flow

## Goal
Test the current Telegram-oriented command stack without requiring full Telegram bot/webhook integration yet.

## Scope
This test flow covers the currently implemented internal Telegram command path:
- command contract
- command parsing
- command handling
- Telegram-style text presentation

It does **not** yet cover:
- real Telegram webhook ingestion
- real Telegram media/file upload intake
- inline button flows

---

## Preconditions
Start the app locally:
```bash
cd /root/.openclaw/workspace
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:push
npm run dev
```

Seed some data first:
```bash
curl -X POST http://localhost:3000/pipeline/profile-demo
curl -X POST http://localhost:3000/pipeline/chat-demo
```

---

## Test objective 1 — Verify thread/followup state exists
Check:
```bash
curl http://localhost:3000/threads
curl http://localhost:3000/followups
```

You should have at least one thread and usually at least one follow-up task.

---

## Test objective 2 — Verify command parsing inputs
The current parser supports these command forms:
- `/followups`
- `/threads`
- `/thread <threadId>`
- `/close <threadId>`
- `/reopen <threadId>`
- `/stage <threadId> <stage>`
- `/mark-sent <threadId> <text>`
- `/mark-replied <threadId> <text>`
- `/followup <threadId> <note>`

Use a valid thread id from `/threads` during manual testing.

---

## Test objective 3 — Verify command handler expectations
Current handler coverage:
- `/followups`
- `/threads`
- `/thread <threadId>`
- `/close <threadId>`
- `/reopen <threadId>`
- `/stage <threadId> <stage>`
- `/mark-sent <threadId> <text>`
- `/mark-replied <threadId> <text>`
- `/followup <threadId> <note>`

Expected Telegram-style outputs:
- followup list text
- compact thread list text
- thread detail text
- action confirmation text

---

## Suggested manual simulation
Until a real Telegram adapter exists, simulate the command flow in this order:

1. generate demo data
2. inspect `/threads` to get a thread id
3. mentally or locally feed commands such as:
   - `/thread <threadId>`
   - `/close <threadId>`
   - `/reopen <threadId>`
   - `/mark-sent <threadId> hey let’s grab a drink next week`
   - `/followup <threadId> follow up on Sunday`
4. verify the corresponding backend state changes through:
   - `/threads`
   - `/followups`
   - `/state`

---

## Exit criteria for Step 6e
- Telegram-oriented test flow documented
- current limitations clearly stated
- path from command text to backend action is understandable to a human reviewer
