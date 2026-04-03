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

## Test 7 — Inspect raw repository state
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
