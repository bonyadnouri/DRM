# Manual Test Checklist

## Goal
Verify the current Hinge Copilot CRM runtime path end-to-end in local development.

## Setup
```bash
cd /root/.openclaw/workspace
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:push
npm run dev
```

The default runtime uses Prisma + SQLite.

---

## Test 1 — Health
```bash
curl http://localhost:3000/health
```
Expected:
- `ok: true`
- `persistenceProvider: "prisma"`
- count fields present

---

## Test 2 — Profile extraction only
```bash
curl -X POST http://localhost:3000/extract/profile-demo
```
Expected:
- structured profile extraction payload
- `kind: "profile_batch"`

---

## Test 3 — Profile extraction pipeline
```bash
curl -X POST http://localhost:3000/pipeline/profile-demo
```
Expected:
- extraction output
- normalized intake payload
- created profile/thread/drafts result
- telegramPreview text

---

## Test 4 — Chat extraction pipeline
```bash
curl -X POST http://localhost:3000/pipeline/chat-demo
```
Expected:
- extraction output
- normalized intake payload
- created/updated chat result
- telegramPreview text
- follow-up task in result when applicable

---

## Test 5 — Inspect threads
```bash
curl http://localhost:3000/threads
```
Expected:
- thread list with embedded profile/messages/drafts/tasks

---

## Test 6 — Inspect followups
```bash
curl http://localhost:3000/followups
```
Expected:
- open follow-up tasks with thread/profile context

---

## Test 7 — Thread state transition actions
First get a thread id from:
```bash
curl http://localhost:3000/threads
```

Then test:
```bash
curl -X POST http://localhost:3000/threads/<threadId>/close
curl -X POST http://localhost:3000/threads/<threadId>/reopen
curl -X POST http://localhost:3000/threads/<threadId>/stage \
  -H 'content-type: application/json' \
  -d '{"stage":"followup_needed"}'
```
Expected:
- thread stage changes successfully
- updated thread returned in response

---

## Test 8 — Operator outbound actions
Using a valid thread id:
```bash
curl -X POST http://localhost:3000/threads/<threadId>/mark-sent \
  -H 'content-type: application/json' \
  -d '{"body":"Sent a playful opener."}'

curl -X POST http://localhost:3000/threads/<threadId>/mark-replied \
  -H 'content-type: application/json' \
  -d '{"body":"Replied and kept momentum going."}'
```
Expected:
- outbound message is logged
- thread summary updates
- thread remains/returns active

---

## Test 9 — Follow-up task actions
First inspect current followups:
```bash
curl http://localhost:3000/followups
```

Then create a manual follow-up:
```bash
curl -X POST http://localhost:3000/threads/<threadId>/followups \
  -H 'content-type: application/json' \
  -d '{"note":"Follow up after weekend","dueAt":"2026-04-06T10:00:00.000Z","priority":"medium"}'
```

Then reschedule / complete a task:
```bash
curl -X POST http://localhost:3000/tasks/<taskId>/reschedule \
  -H 'content-type: application/json' \
  -d '{"dueAt":"2026-04-07T10:00:00.000Z"}'

curl -X POST http://localhost:3000/tasks/<taskId>/done
```
Expected:
- follow-up task can be created
- due date can be changed
- task can be marked done

---

## Test 10 — Inspect raw repository state
```bash
curl http://localhost:3000/state
```
Expected:
- persisted state model collections returned

---

## Notes
- Current extraction is mock by default unless `OPENAI_API_KEY` is configured.
- Current Telegram behavior is still a presenter/output layer, not a full inbound bot flow.
- Current chat pipeline uses hint-based thread resolution with demo fallback.
