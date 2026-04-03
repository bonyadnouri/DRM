# Telegram Operator Contract

## Goal
Define the first usable Telegram-facing operator workflow for the Hinge Copilot CRM.

This document is intentionally practical.
It defines what the operator sends, what the system returns, and which actions are supported first.

---

## Primary operator jobs
The Telegram operator needs to do five things well:

1. submit new profile screenshots
2. submit chat screenshots for existing conversations
3. inspect threads and follow-ups
4. record what was sent or done
5. change thread/task state intentionally

---

## Input modes

### Mode A — Screenshot batch upload
Operator sends one or more screenshots.

Two intended classes:
- **profile batch**
- **chat batch**

System responsibility:
- detect intended intake type or ask for clarification later
- extract structured fields
- map into CRM state
- return concise operator-ready output

### Mode B — Text commands
Operator sends a short command in Telegram.

Initial command family:
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

## Output contracts

### Output 1 — New profile result
Must include:
- display name and age if available
- short summary
- recommended opener
- 1-2 alternatives
- thread id or reference handle

Example shape:
- `New profile: Mila, 27`
- `Summary: witty, active, Berlin, padel hook`
- `Recommended opener: ...`
- `Alternatives: ...`
- `Thread: <id>`

### Output 2 — Chat update result
Must include:
- profile/thread reference
- short conversation summary
- recommended reply
- alternatives
- follow-up note if relevant

### Output 3 — Follow-up list
Must include:
- due follow-ups ordered by urgency
- profile/thread reference
- due date
- short note

### Output 4 — Action confirmation
Used for commands like close/reopen/mark-sent/reschedule.
Must include:
- what changed
- target thread/task
- resulting state if relevant

---

## Initial command behavior

### `/followups`
Return open follow-up tasks with brief context.

### `/threads`
Return a compact thread list or top active threads.

### `/thread <threadId>`
Return one detailed thread view:
- profile
- stage
- recent messages
- latest drafts
- open tasks

### `/close <threadId>`
Close the thread and confirm.

### `/reopen <threadId>`
Reopen the thread and confirm.

### `/stage <threadId> <stage>`
Set explicit thread stage and confirm.

### `/mark-sent <threadId> <text>`
Log outbound message and confirm.

### `/mark-replied <threadId> <text>`
Log outbound reply and confirm.

### `/followup <threadId> <note>`
Create a follow-up task and confirm.

---

## UX principles
- short replies by default
- one recommended action first
- alternatives only when useful
- avoid giant walls of JSON in Telegram
- operator-facing ids should stay visible until friendlier handles exist

---

## Not in first Telegram pass
- full automatic bot autonomy
- inline buttons / callback flows
- media persistence from real Telegram uploads
- polished disambiguation flows
- multi-user operator support

---

## Success criteria for Step 6a
- Telegram operator workflow is explicitly defined
- first command surface is chosen
- expected outputs are concrete enough to build formatters and routing next
