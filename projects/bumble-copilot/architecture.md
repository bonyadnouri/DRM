# Bumble Copilot / Dating CRM Architecture

## 1. Executive summary

This system should behave less like a “bot that dates for you” and more like a **Telegram-first operating system for dating workflows**:

- **Telegram** is the control room: inbox, approvals, reminders, summaries, suggested replies, next actions
- **CRM backend** is the source of truth: people, conversations, status, notes, tasks, approvals, outcomes
- **AI services** help with drafting, prioritization, summarization, and recommendations
- **Human approval** is mandatory for high-risk or identity-bearing actions
- **Automation** is staged carefully, starting with low-risk ingestion and drafting before any direct platform action

The right architecture is:
- **modular** enough to swap Bumble intake methods later
- **approval-driven** so the user stays in control
- **event-based** so it can become more autonomous without becoming messy
- **local-first / maintainable** so the system survives iteration

---

## 2. Product goals

### Primary goals
1. Reduce Bonyad’s mental load in managing matches and conversations.
2. Keep momentum across many leads without losing context.
3. Turn scattered chats into a clear pipeline toward phone number / date.
4. Generate high-quality drafts in Bonyad’s style.
5. Preserve human oversight for critical messaging and platform-risk actions.

### Non-goals
1. Fully autonomous romantic impersonation.
2. Unbounded message sending without approval.
3. Aggressive automation that materially increases ban or detection risk.
4. Overbuilding a complex distributed system before validating workflows.

---

## 3. Design principles

### 3.1 Telegram-first, not Telegram-only
Telegram should be the main interface for:
- seeing new leads/matches
- getting reply suggestions
- approving messages/actions
- receiving reminders and daily summaries
- updating CRM state quickly

But the actual system state should live in a backend database, not in Telegram message history.

### 3.2 Human-in-the-loop by default
Anything that speaks in Bonyad’s voice or changes state on Bumble should have explicit approval boundaries.

### 3.3 Semi-automation before direct automation
Phase 1 should support:
- manual or assisted Bumble intake
- AI-generated suggestions
- Telegram approvals
- CRM state tracking

Only later should the system consider browser automation or direct platform action.

### 3.4 One source of truth
The CRM/backend owns:
- contact records
- conversation state
- message drafts
- approval decisions
- activity history
- reminders / tasks

### 3.5 Everything important is auditable
The system should preserve:
- who/what generated a draft
- prompt/policy version used
- whether Bonyad edited it
- whether it was approved/sent
- when a status changed and why

### 3.6 Maintainability over “AI magic”
The architecture should prefer:
- explicit state machines
- clear component boundaries
- typed schemas
- append-only event logs where helpful
- prompt/version management
- deterministic rules for risky behavior

---

## 4. High-level architecture

## 4.1 Core components

### A. Telegram Bot Interface
Primary operator interface.

Responsibilities:
- deliver notifications and summaries
- present candidate actions
- show profile/match context
- offer approval buttons for drafts/actions
- accept quick commands and notes

Examples:
- “3 new matches need openers”
- “Here are 2 draft replies for Sara. Approve / edit / snooze.”
- “Nudge this lead? yes/no”

### B. API / Orchestrator Service
The central application service.

Responsibilities:
- expose internal APIs
- coordinate workflow state changes
- invoke AI services
- create approval requests
- dispatch jobs/events
- enforce policy and approval rules

This is the brain of the application, but not the storage layer.

### C. CRM Database
The system of record.

Stores:
- profiles/leads
- conversations
- messages
- drafts
- approvals
- notes
- tags
- tasks/reminders
- state transitions
- experiment metadata

### D. Intake Adapter Layer
A pluggable boundary for getting Bumble data into the system.

Supported progressively:
1. **Manual intake**: copy/paste profile text, screenshots, notes
2. **Assisted intake**: browser extension / bookmarklet / structured paste
3. **Semi-automated sync**: browser automation with strong guardrails

This must be an adapter boundary so the rest of the system does not care how the data arrived.

### E. AI Copilot Services
A set of bounded capabilities, not one giant agent.

Sub-capabilities:
- opener generation
- reply drafting
- profile summarization
- tone/style adaptation
- priority scoring
- next-step recommendation
- conversation health/risk classification

These should be callable as separate tools/modules so prompts and quality can evolve independently.

### F. Approval Engine
A dedicated layer that decides:
- whether an action requires approval
- who can approve it
- whether approvals expire
- whether edits invalidate approval
- whether a previously approved action can still be executed

### G. Workflow / Rules Engine
A relatively simple state-machine service.

Responsibilities:
- move leads through stages
- trigger reminders
- identify stale conversations
- schedule re-engagement suggestions
- enforce “don’t send twice without reply” type rules

### H. Job Queue / Scheduler
Handles asynchronous work:
- generating drafts
- daily summaries
- reminder checks
- classification jobs
- retrying ingestion/parsing steps

### I. Admin / Review Console
A lightweight web UI or internal dashboard for:
- reviewing CRM records
- editing states in bulk
- inspecting event history
- debugging failed jobs
- managing templates, prompts, tags, and policies

For MVP, this can be very basic, but it becomes important fast.

---

## 5. Suggested deployment shape

For maintainability, start with a simple monolith plus queue pattern.

### Recommended initial stack
- **Backend**: TypeScript / Node.js
- **API**: NestJS, Fastify, or Express with strict module boundaries
- **DB**: Postgres
- **Queue**: Redis + BullMQ or Postgres-backed jobs
- **Telegram bot**: integrated into same codebase initially
- **LLM provider abstraction**: one internal interface, multiple providers possible later
- **Storage**: local/S3-compatible bucket for screenshots and artifacts

### Why this shape
A modular monolith is the sweet spot here:
- fewer moving parts
- easier local development
- fast iteration
- still clean enough to split later if needed

Do **not** start with microservices. That would be pure self-inflicted pain.

---

## 6. Domain model

The core idea is to separate:
- the **person/contact**
- the **dating-platform identity record**
- the **conversation thread**
- the **actions/drafts/approvals**

## 6.1 Main entities

### 1. Person
Represents the real-world lead/contact as understood by the CRM.

Fields:
- `id`
- `display_name`
- `age` (nullable)
- `location_text`
- `bio`
- `occupation`
- `education`
- `interests` (array/tag relation)
- `profile_summary`
- `attractiveness_score` (optional/manual)
- `compatibility_score` (AI/manual hybrid)
- `risk_flags` (sparse JSON / related table)
- `notes`
- `created_at`
- `updated_at`

### 2. PlatformProfile
Represents a profile on a specific platform.

Fields:
- `id`
- `person_id`
- `platform` (e.g. `bumble`)
- `platform_profile_id` (nullable if unknown/manual)
- `profile_url` (nullable)
- `raw_profile_payload` (JSON)
- `photos_metadata` (JSON)
- `verification_status`
- `intake_source` (`manual`, `extension`, `automation`)
- `ingested_at`

### 3. Match
Represents a mutual match or pre-match lead object, depending on workflow.

Fields:
- `id`
- `platform_profile_id`
- `match_status` (`lead`, `matched`, `expired`, `unmatched`, `blocked`, `archived`)
- `matched_at`
- `expires_at` (important on Bumble timing)
- `last_seen_at`
- `priority_score`
- `pipeline_stage_id`
- `owner` (usually Bonyad)

### 4. ConversationThread
One conversation stream per platform interaction.

Fields:
- `id`
- `match_id`
- `channel` (`bumble_chat`, `telegram_review`, `whatsapp`, etc.)
- `thread_status` (`not_started`, `awaiting_opener`, `active`, `waiting_on_them`, `waiting_on_us`, `stale`, `moved_off_platform`, `closed`)
- `last_message_at`
- `last_inbound_at`
- `last_outbound_at`
- `sentiment_summary`
- `summary`
- `next_recommended_action`
- `next_action_due_at`

### 5. Message
Represents an actual inbound or outbound message.

Fields:
- `id`
- `thread_id`
- `direction` (`inbound`, `outbound`)
- `source` (`bumble`, `manual`, `automation`, `telegram_proxy`)
- `platform_message_id` (nullable)
- `body_text`
- `body_normalized`
- `sent_at`
- `received_at`
- `author_type` (`lead`, `bonyad`, `system`)
- `delivery_status` (`draft`, `queued`, `sent`, `failed`, `canceled`)
- `reply_to_message_id` (nullable)

### 6. Draft
A candidate outbound message or action suggestion.

Fields:
- `id`
- `thread_id`
- `draft_type` (`opener`, `reply`, `follow_up`, `reengagement`, `ask_out`, `bio_note`, `classification`)
- `content`
- `tone`
- `strategy_label`
- `generation_reason`
- `model_provider`
- `model_name`
- `prompt_version`
- `policy_version`
- `input_snapshot` (JSON)
- `status` (`generated`, `pending_approval`, `approved`, `edited`, `rejected`, `expired`, `sent`)
- `created_by` (`system`, `human`, `hybrid`)
- `created_at`

### 7. ApprovalRequest
Approval boundary object.

Fields:
- `id`
- `draft_id` or `action_id`
- `approval_type` (`send_message`, `change_stage`, `schedule_followup`, `execute_platform_action`)
- `requested_by`
- `requested_at`
- `status` (`pending`, `approved`, `rejected`, `expired`, `superseded`, `executed`)
- `approved_by`
- `approved_at`
- `expires_at`
- `approval_context_snapshot` (JSON)
- `telegram_message_id` (for inline buttons)

### 8. Action
An executable system action.

Examples:
- send this message
- mark as stale
- snooze 3 days
- move to phone-number stage
- request manual review

Fields:
- `id`
- `thread_id` or `match_id`
- `action_type`
- `payload` (JSON)
- `risk_level` (`low`, `medium`, `high`)
- `requires_approval` (bool)
- `status` (`proposed`, `pending_approval`, `approved`, `scheduled`, `executing`, `completed`, `failed`, `canceled`)
- `scheduled_for`
- `executed_at`
- `result_payload`

### 9. PipelineStage
Configurable CRM stage.

Suggested default stages:
- New Lead
- Matched
- Needs Opener
- Opener Sent
- Active Chat
- High Potential
- Need Follow-up
- Number Exchanged
- Date Proposed
- Date Scheduled
- Ghosted / Stale
- Closed / Archived

Fields:
- `id`
- `name`
- `sequence`
- `is_terminal`
- `sla_hours` (optional)
- `default_next_action`

### 10. Note
Human or AI note attached to a lead/thread.

Fields:
- `id`
- `person_id` or `thread_id`
- `author_type` (`human`, `system`)
- `note_type` (`observation`, `strategy`, `preference`, `warning`, `date_idea`)
- `content`
- `visibility` (`internal_only`)
- `created_at`

### 11. Task / Reminder
Keeps momentum.

Fields:
- `id`
- `related_entity_type`
- `related_entity_id`
- `task_type` (`reply_needed`, `follow_up`, `review_profile`, `send_opener`, `check_stale_chat`)
- `due_at`
- `priority`
- `status` (`open`, `done`, `snoozed`, `canceled`)
- `created_reason`

### 12. EventLog
Append-only audit trail.

Fields:
- `id`
- `entity_type`
- `entity_id`
- `event_type`
- `actor_type` (`system`, `human`, `automation`)
- `payload`
- `created_at`

---

## 7. Recommended data relationships

- `Person 1 -> many PlatformProfiles`
- `PlatformProfile 1 -> many Matches` (usually 1 current, but keep flexibility)
- `Match 1 -> many ConversationThreads` (supports off-platform migration later)
- `ConversationThread 1 -> many Messages`
- `ConversationThread 1 -> many Drafts`
- `Draft 0..1 -> 1 ApprovalRequest` for send-type approvals
- `Match / Thread -> many Tasks`
- `Any major entity -> many EventLogs`

This separation avoids mixing CRM identity with platform-specific weirdness.

---

## 8. Workflow states

The system should use a **small explicit state machine**, not vague tags everywhere.

## 8.1 Lead / match lifecycle

### Lead state machine
1. `captured`
2. `triaged`
3. `liked` / `passed`
4. `matched`
5. `conversation_started`
6. `active`
7. `qualified`
8. `number_exchanged`
9. `date_planned`
10. `date_completed` or `closed`

### Failure / terminal branches
- `expired`
- `unmatched`
- `ghosted`
- `archived`
- `not_a_fit`

## 8.2 Conversation operational states
These are more useful day to day than high-level lifecycle states.

- `awaiting_review` — new intake not yet checked
- `awaiting_opener` — match exists, no opener approved yet
- `awaiting_send_approval` — draft ready, waiting for Bonyad
- `message_ready_to_send` — approved, pending execution
- `waiting_on_them` — last outbound sent, waiting for reply
- `waiting_on_us` — inbound message received, reply needed
- `stale_needs_followup` — no reply after threshold, follow-up suggested
- `escalate_off_platform` — ready to ask for number/Instagram/date
- `archived` — inactive/closed

## 8.3 Task states
- `created`
- `notified`
- `acknowledged`
- `done`
- `snoozed`
- `canceled`

---

## 9. Approval boundaries

This is the most important part of the product.

## 9.1 Approval policy by action type

### Always require explicit approval
1. Sending any outbound message in Bonyad’s voice
2. Sending a follow-up after silence
3. Asking for phone number / Instagram / date
4. Any direct platform action through automation
5. Any profile bio or preference change
6. Any risky or ambiguous message classified by the system

### Usually no approval needed
1. Ingesting profile/message data
2. Summarizing conversations
3. Updating internal notes
4. Creating reminders/tasks
5. Re-ranking leads internally
6. Suggesting stage changes (but not necessarily applying major ones silently)

### Optional / configurable approval
1. Marking a thread stale
2. Moving to low-risk internal pipeline states
3. Snoozing reminders
4. Auto-archiving dead conversations after long inactivity

## 9.2 Approval invalidation rules
Approval should become invalid if:
- the draft content changes materially
- a new inbound message arrives
- the approval window expires
- the thread context changes significantly
- a policy version marks it newly risky

## 9.3 Telegram approval UX
Each approval card should include:
- lead name + short summary
- latest incoming/outgoing messages
- proposed draft
- strategy label (playful, direct, curious, etc.)
- reason it was suggested
- buttons: `Approve`, `Edit`, `Reject`, `Snooze`, `More options`

Possible extra buttons:
- `Shorter`
- `More flirty`
- `More direct`
- `Ask question`
- `Offer date idea`

### Good operational rule
Telegram should approve **intentful units**, not raw model output detached from context.

---

## 10. Messaging architecture

The system should treat messaging as a pipeline:

1. **Context assembly**
   - fetch profile summary
   - recent thread summary
   - latest inbound message(s)
   - style memory / user preferences
   - stage constraints

2. **Draft generation**
   - generate 1-3 candidate replies
   - classify tone and risk
   - attach rationale and strategy labels

3. **Policy pass**
   - check for prohibited patterns
   - check over-investment / cringe / repetition
   - check whether approval is required

4. **Approval**
   - send approval request to Telegram
   - support quick edit/regenerate

5. **Execution**
   - either manual send by Bonyad
   - or later semi-automated send through an adapter

6. **Post-send update**
   - record outbound message
   - transition thread state to `waiting_on_them`
   - schedule reminder if no response in X days

This pipeline should be explicit in code, not hidden inside one mega prompt.

---

## 11. AI subsystem design

## 11.1 Separate bounded AI tasks
Do not build “one agent that does everything.” Break it up.

Suggested modules:
- **Profile Summarizer**: extract a compact summary and hooks
- **Opener Generator**: create first-message options
- **Reply Drafter**: respond to inbound messages
- **Stage Recommender**: recommend next pipeline step
- **Priority Scorer**: rank who deserves attention first
- **Follow-up Generator**: suggest re-engagement messages
- **Safety/Tone Checker**: detect awkward, repetitive, needy, or risky drafts

## 11.2 Prompt/version management
Every draft should store:
- prompt version
- model used
- style policy version
- structured inputs

This matters because later you will absolutely wonder why one message was good and another was weird.

## 11.3 Style memory
Maintain a lightweight style profile for Bonyad, not an unconstrained personality clone.

Useful style dimensions:
- concise vs verbose
- playful vs direct
- flirty intensity
- emoji tolerance
- question frequency
- date escalation threshold
- banned phrases / cringe patterns

Prefer structured style settings over giant prose instructions.

---

## 12. Automation surfaces and risk tiers

## 12.1 Risk tiering

### Tier 0: Internal only
- summarization
- scoring
- reminders
- notes
- stage suggestions

Low risk. Can be autonomous.

### Tier 1: Assisted external actions
- preparing message drafts
- producing opener suggestions
- pre-filling responses for manual send

Still safe if approval remains mandatory.

### Tier 2: Semi-automated platform actions
- sending approved messages
- capturing inbound chat updates
- updating local state based on Bumble state

Higher risk. Requires strong guardrails and approval.

### Tier 3: Full automation
- autonomous sending
- autonomous follow-up sequences
- autonomous escalation to date planning

Not recommended for early phases. Too much identity risk, too much platform risk, too little trust.

## 12.2 Recommended risk posture
For MVP and likely beyond:
- allow Tier 0 freely
- allow Tier 1 with approval
- defer Tier 2 until workflow quality is proven
- avoid Tier 3 entirely unless there is an unusually robust reason

---

## 13. Intake architecture

This is where many systems get ugly. Keep it pluggable.

## 13.1 Intake modes

### Mode A: Manual intake
Bonyad sends to Telegram:
- screenshots
- copied profile text
- copied chat excerpts
- quick voice/text notes

System parses and stores structured CRM objects.

Pros:
- lowest ban risk
- fast to ship
- enough to validate workflow

Cons:
- more manual effort

### Mode B: Assisted browser intake
A browser extension or bookmarklet extracts:
- profile text
- message thread text
- timestamps
- photos metadata if available

Pros:
- much lower friction
- still can keep human-controlled flow

Cons:
- more engineering
- browser DOM fragility

### Mode C: Semi-automated browser agent
Scripted session collects new matches/messages and maybe executes approved sends.

Pros:
- lowest operator effort

Cons:
- highest ban/detection risk
- brittle UI automation
- more safety complexity

## 13.2 Architectural recommendation
Design the rest of the system so it only depends on an `IntakeAdapter` and `ExecutionAdapter` interface.

For example:
- `ingestProfile(payload)`
- `ingestConversation(payload)`
- `sendApprovedMessage(action)`
- `syncNewMessages()`

That way the CRM/workflow layer stays stable while adapter strategies evolve.

---

## 14. Telegram operating model

Telegram should feel like a calm control tower, not spam.

## 14.1 Key message types
1. **New match alert**
2. **Draft approval card**
3. **Need-reply digest**
4. **Daily summary**
5. **Stale-thread reminder**
6. **Escalation opportunity suggestion**
7. **Weekly pipeline report**

## 14.2 Good command surface
Suggested commands:
- `/inbox` — show threads needing attention
- `/match <name>` — show CRM summary for one lead
- `/draft <thread>` — generate draft options
- `/approve <id>` — approve draft/action
- `/reject <id>` — reject
- `/snooze <id> 2d` — snooze task
- `/note <thread> ...` — save a note
- `/stage <thread> active_chat` — update stage
- `/summary` — today’s overview

Inline buttons are even better where possible.

## 14.3 Notification discipline
Avoid notification overload.

Default policy:
- immediate alerts only for new inbound messages / ready approvals
- batch low-priority items into digest mode
- daily summary for overview
- weekly report for strategy improvement

---

## 15. Internal services / modules

A clean modular monolith could be split like this:

- `telegram` — bot transport, commands, approval card rendering
- `crm` — people, profiles, matches, notes, tags
- `threads` — conversations, messages, summaries
- `drafting` — AI drafting pipeline
- `approvals` — approval rules and lifecycle
- `workflow` — stage machine, reminders, follow-up logic
- `intake` — profile/chat ingestion adapters
- `execution` — optional send/sync adapters later
- `reporting` — digests, summaries, metrics
- `policy` — safety rules, risk checks, style constraints
- `audit` — event logging and observability

This is a good balance between separation and practicality.

---

## 16. Core workflows

## 16.1 New match -> opener workflow
1. Match data enters system
2. CRM record is created or updated
3. Profile summarizer extracts hooks and compatibility notes
4. Workflow sets state to `awaiting_opener`
5. Opener generator creates 2-3 options
6. Approval request is sent to Telegram
7. Bonyad approves or edits
8. Message is sent manually or via adapter
9. Thread moves to `waiting_on_them`
10. Reminder scheduled if no response in X hours/days

## 16.2 Inbound message -> reply workflow
1. New inbound message ingested
2. Thread moves to `waiting_on_us`
3. Conversation summarizer updates thread summary
4. Reply drafter generates candidate messages
5. Tone/safety checker validates
6. Approval card sent to Telegram
7. Bonyad approves/edits/rejects
8. Outbound message recorded/sent
9. Thread moves back to `waiting_on_them`

## 16.3 Stale conversation -> re-engagement workflow
1. Scheduler detects no response after threshold
2. Workflow checks rules:
   - was last message from us?
   - did we already follow up?
   - how strong was conversation quality?
3. If eligible, generate one follow-up suggestion
4. Approval required
5. If approved, send and record
6. If rejected, mark `stale` or snooze

## 16.4 Progression -> number/date workflow
1. Classifier detects strong engagement signals
2. System suggests escalation opportunity
3. Draft asks for number/date in an appropriate way
4. Approval required
5. If successful, create off-platform thread/contact linkage
6. Move stage to `number_exchanged` or `date_planned`

---

## 17. Metrics and feedback loops

If the system is going to improve, it needs feedback.

Track:
- opener approval rate
- reply approval rate
- edit-before-approval rate
- response rate after opener
- response rate after follow-up
- number exchange rate
- date conversion rate
- time-to-first-reply
- stale thread count
- AI draft usefulness score (simple thumbs up/down or 1-5)

These metrics should inform prompt and workflow improvement.

---

## 18. Observability and safety

## 18.1 Logging
Log:
- intake success/failure
- draft generation results
- approval lifecycle changes
- execution attempts
- state transitions
- policy violations

## 18.2 Guardrails
Examples:
- never send without approval in MVP
- never send if new inbound arrived after approval
- no more than one follow-up without explicit user instruction
- no duplicate openers / repetitive phrasing across leads in short windows
- hard block certain categories of creepy/overinvested language

## 18.3 Manual override
Bonyad should always be able to:
- edit any CRM field
- override a suggested stage
- dismiss any recommendation
- disable automations by category

---

## 19. MVP boundary recommendation

## 19.1 What MVP should include
1. Telegram bot
2. Postgres-backed CRM
3. Manual/assisted intake
4. Match + thread + message storage
5. Draft generation for openers/replies
6. Approval queue in Telegram
7. Pipeline stages and reminders
8. Daily summary / inbox digest
9. Basic admin/review UI or CLI tooling
10. Audit log

## 19.2 What MVP should not include
1. Full browser automation
2. Auto-send without approval
3. Multi-platform support beyond clean abstraction points
4. Complex autonomous agents that plan end-to-end
5. Fancy scoring systems before enough data exists

---

## 20. Staged roadmap

## Stage 0: Foundations
Goal: establish data model and safe operating loop.

Deliverables:
- architecture doc
- schema design
- module boundaries
- approval policy definition
- prompt/style policy draft
- Telegram UX sketch

## Stage 1: CRM + Telegram shell
Goal: create the control room and source of truth.

Build:
- database schema
- basic backend modules
- Telegram bot with commands
- match/thread/message CRUD
- note/task support
- pipeline stage tracking
- daily/inbox summaries

Outcome:
A usable manual CRM operated through Telegram.

## Stage 2: AI drafting copilot
Goal: become actually helpful.

Build:
- profile summarizer
- opener generator
- reply generator
- draft storage
- approval requests
- edit/reject/regenerate flow
- prompt version tracking

Outcome:
Telegram-first approval-driven messaging assistant.

## Stage 3: Assisted intake
Goal: reduce manual data entry.

Build one of:
- structured paste flow
- screenshot parser
- browser extension/bookmarklet

Outcome:
New matches and messages enter the system with much lower friction.

## Stage 4: Workflow automation
Goal: reduce operational overhead without losing control.

Build:
- stale thread detection
- follow-up suggestions
- escalation suggestions
- configurable reminder policies
- priority ranking

Outcome:
System starts acting like a disciplined copilot instead of just storage + drafts.

## Stage 5: Semi-automated execution (optional, high caution)
Goal: execute approved actions with minimal friction.

Build:
- execution adapter abstraction
- approval-to-send pipeline
- post-send reconciliation
- strict rate and risk controls

Outcome:
Approved messages can be executed with guardrails.

## Stage 6: Optimization and learning
Goal: improve quality and outcomes.

Build:
- feedback capture
- analytics dashboard
- A/B prompt comparison
- strategy heuristics
- better personalization and prioritization

---

## 21. Suggested implementation order

This is the order I would actually build it in.

### Order 1: Define schemas and states first
Build:
- entity schema
- workflow states
- approval rules
- event log design

Reason:
If the data model is sloppy, everything else turns into glue code and regret.

### Order 2: Build the Telegram control surface
Build:
- bot setup
- `/inbox`, `/match`, `/summary`, notes, stage updates
- approval message rendering primitives

Reason:
This validates the Telegram-first operating model immediately.

### Order 3: Implement core CRM backend
Build:
- CRUD for people/profiles/matches/threads/messages
- tasks/reminders
- state transitions
- audit logging

Reason:
Need a real source of truth before AI starts generating junk around a shaky core.

### Order 4: Add manual intake flow
Build:
- create/update leads from pasted text/screenshots
- attach chat excerpts
- basic parsing helpers

Reason:
You need real data in the system now, not after months of automation work.

### Order 5: Add drafting + approvals
Build:
- opener generation
- reply drafting
- draft entity lifecycle
- Telegram approve/edit/reject loop

Reason:
This is the first truly magical-feeling feature, but now it sits on stable rails.

### Order 6: Add reminders and stale-thread workflow
Build:
- scheduler
- follow-up suggestions
- daily digest
- priority inbox

Reason:
This is where the system starts saving real mental energy.

### Order 7: Add assisted intake
Build:
- browser extension/bookmarklet or structured import
- screenshot OCR if useful

Reason:
Only worth building after the core operating loop proves valuable.

### Order 8: Consider execution adapters carefully
Build only if justified:
- send approved messages
- sync inbound automatically
- reconciliation and risk controls

Reason:
This is the highest-risk engineering surface and should come after workflow confidence exists.

---

## 22. Concrete MVP recommendation

If forced to choose the leanest high-value version, I would build this:

### MVP v1
- Telegram bot
- Postgres CRM
- Manual match/chat intake
- AI opener + reply drafts
- Approval queue
- Reminder engine
- Daily summary
- Basic notes and pipeline stages

### Why this is the right MVP
Because it captures most of the value:
- less context switching
- less forgotten matches
- faster replies
- better consistency
- preserved human control

And it avoids the worst early traps:
- brittle automation
- platform risk
- overcomplicated architecture
- fake autonomy that creates cleanup work

---

## 23. Final recommendation

The best architecture is a **Telegram-first modular monolith with a strong CRM core, explicit workflow states, dedicated approval objects, pluggable intake/execution adapters, and bounded AI services**.

If done right, the system will feel like:
- a calm inbox manager
- a memory layer for all leads
- a message drafting copilot
- a follow-up discipline engine
- a strategic CRM for dating

Not like an out-of-control dating bot.

That distinction matters a lot.
