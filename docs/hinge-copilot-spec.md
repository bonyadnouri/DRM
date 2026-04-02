# Hinge Copilot CRM — Product Spec (MVP)

## 1. Goal
Build a Telegram-first copilot for Hinge that turns screenshot batches into a structured CRM, generates first-message/comment drafts, tracks active conversations, and proposes next replies in Bonyad's style.

The user will still:
- browse/swipe on the phone
- take screenshots
- paste/send the final chosen message manually

The system will:
- ingest screenshot batches
- extract profile/chat data
- create/update person + thread records
- generate opener/reply options
- track pipeline stages and follow-up needs
- provide concise operator workflows in Telegram

## 2. Product Principles
- Human-in-the-loop for all outbound sending.
- Telegram-first control surface.
- Screenshot-first input UX.
- Fast enough to reduce per-profile effort to a few seconds.
- High trust via auditability, confidence scores, and explicit identity resolution.
- Optimized for many parallel threads.

## 3. Core User Jobs
1. Send screenshots of a new Hinge profile and get a strong opener/comment.
2. Send screenshots of an existing chat and get context-aware replies.
3. Keep all women/threads organized in a CRM automatically.
4. Know who to prioritize, follow up with, or close for number/date.
5. Avoid losing context across dozens of concurrent conversations.

## 4. Primary Surfaces
### 4.1 Telegram
Telegram is the command center.
Main flows:
- upload screenshot batch
- receive parsed summary
- choose suggested opener/reply
- inspect CRM summaries
- review stale threads / follow-ups

### 4.2 Internal backend / CRM
Stores:
- profiles
- threads
- messages
- drafts
- stage history
- notes
- tasks/followups
- raw screenshot attachments and extraction metadata

## 5. Input Model
### 5.1 New profile batch
Input: 1..N screenshots that belong to one Hinge profile.
Expected content:
- name
- age
- prompts and prompt answers
- bio fragments
- photo cues
- location/school/job if visible

System tasks:
- OCR + visual extraction
- deduplicate overlapping text across screenshots
- infer profile-level summary
- generate multiple opener/comment options
- create profile + thread shell if user confirms send

### 5.2 Chat update batch
Input: 1..N screenshots from an ongoing chat.
System tasks:
- identify thread/person
- extract new inbound/outbound messages
- merge into canonical chronology
- summarize current state
- produce 3+ reply options
- update stage and follow-up recommendations

### 5.3 Inbox / list screenshots (later)
Potential later input:
- conversation list screenshots
- match list screenshots
- notification screenshots

Purpose:
- detect stale threads
- bulk-prioritize inbox
- recover context quickly

## 6. Core Entities
### 6.1 Profile
Represents one woman/person on Hinge.
Suggested fields:
- id
- platform (hinge)
- display_name
- age
- location
- occupation
- education
- bio
- prompt_set[]
- photo_notes[]
- attractiveness_score (optional internal)
- fit_score
- vibe_tags[]
- red_flags[]
- extraction_confidence
- source_attachments[]
- created_at
- updated_at

### 6.2 Thread
Represents one conversation lane with a profile.
Fields:
- id
- profile_id
- platform_thread_ref (nullable at first)
- state
- stage
- last_inbound_at
- last_outbound_at
- last_activity_at
- momentum_score
- next_goal
- followup_due_at
- last_summary
- created_at
- updated_at

### 6.3 Message
Fields:
- id
- thread_id
- direction (inbound|outbound)
- body
- raw_extracted_text
- sent_at_estimated
- source_attachment_id
- confidence
- status (parsed|approved|sent_manual|uncertain)
- created_at

### 6.4 Draft
Fields:
- id
- thread_id
- type (opener|reply|followup)
- style_variant (safe|playful|bold|recommended)
- body
- rationale
- goal
- approved_at
- used_at
- created_at

### 6.5 Attachment
Fields:
- id
- type (screenshot)
- origin (telegram upload)
- sha256
- local_path
- metadata_json
- created_at

### 6.6 Identity resolution candidate
Fields:
- id
- attachment_id
- candidate_profile_id
- score
- evidence_json
- resolution (accepted|rejected|pending)

### 6.7 Task / Follow-up
Fields:
- id
- thread_id
- type (followup|review|clarify_identity)
- due_at
- priority
- status
- note

## 7. Pipeline Stages
Initial proposal:
- `new_profile`
- `opener_ready`
- `opened`
- `awaiting_reply`
- `replied`
- `active_chat`
- `rapport_building`
- `qualification`
- `number_close`
- `date_close`
- `scheduled`
- `stale`
- `ghosted`
- `closed`

MVP can collapse these to:
- new
- opened
- active
- followup_needed
- close_candidate
- closed

## 8. Identity Resolution
This is the hardest systems problem.

### 8.1 Matching signals
- display name
- age
- unique prompt text
- repeated bio fragments
- visible avatar/photo similarity notes
- thread context / recent active profiles
- timestamp proximity
- manual operator confirmation

### 8.2 Confidence behavior
- High confidence: auto-attach to existing profile/thread.
- Medium confidence: attach provisionally and flag review.
- Low confidence: ask user to pick between candidates or create new profile.

### 8.3 Non-goal for MVP
Perfect visual face recognition is not required.
Textual + contextual matching is enough for MVP.

## 9. Reply/Opener Engine
### 9.1 Outputs for new profiles
Return:
- short profile summary
- best hook
- 3 to 5 opener/comment options
- one recommended option
- tonal notes: safe/playful/high-upside

### 9.2 Outputs for active chats
Return:
- chat summary in 2 to 5 bullets
- what she is signaling
- immediate objective
- 3 reply options
- one recommended reply
- optional next-step suggestion (e.g. ask for number, tease, logistics)

### 9.3 Style layer
The system should optimize toward Bonyad's style:
- chill
- intelligent
- funny
- not cringe
- not needy
- concise
- socially calibrated

Future improvement:
- learn from accepted/rejected drafts
- maintain style examples library

## 10. Telegram UX
### 10.1 New profile flow
User sends batch of screenshots.
System responds with:
- matched as new profile
- parsed summary
- recommended opener
- alt drafts A/B/C
- quick actions:
  - mark sent
  - regenerate
  - save without sending
  - skip

### 10.2 Chat reply flow
User sends reply screenshots.
System responds with:
- matched thread/person
- extracted new messages
- updated context summary
- recommended reply + alternatives
- quick actions:
  - mark sent
  - regenerate more playful
  - regenerate shorter
  - set follow-up reminder

### 10.3 CRM queries
Possible commands/queries:
- who needs replies?
- show hot leads
- show stale threads
- who should I close this week?
- summarize Sarah

## 11. Simplest User Experience
The easiest workflow for Bonyad should be:
1. See profile in Hinge.
2. Take multiple screenshots if needed.
3. Send screenshots to Telegram bot/chat in one batch.
4. Receive one concise answer with opener options.
5. Copy best opener into Hinge.
6. When she replies, send new screenshots.
7. Receive reply suggestions instantly.

No desktop dashboard should be required for MVP.
Telegram alone should be enough.

## 12. System Architecture (MVP)
### Components
1. Telegram bot / inbound handler
2. Attachment store
3. OCR + extraction pipeline
4. Entity resolution service
5. CRM database
6. Draft generation service
7. Follow-up/task scheduler
8. Reporting/query layer

### Suggested implementation style
Start as a modular monolith:
- one backend app
- one DB
- one message ingestion pipeline
- clear module boundaries

## 13. Recommended Tech Stack (pragmatic)
- Backend: TypeScript / Node.js
- API/runtime: Fastify or NestJS (Fastify preferred for lean MVP)
- DB: PostgreSQL
- ORM/query: Prisma or Drizzle
- Queue/jobs: BullMQ or a DB-backed lightweight job runner
- File storage: local disk first, S3-compatible later
- OCR/vision extraction: pluggable adapter
- Telegram integration: bot webhook or polling adapter

## 14. Parsing Strategy
Use a layered parser:
1. classify screenshot type
2. extract raw text
3. normalize duplicate OCR spans
4. infer structured fields
5. link to profile/thread
6. generate summaries/drafts

Keep all raw extraction artifacts for later debugging.

## 15. Confidence + Safety Rules
- Never silently overwrite a thread on low-confidence match.
- Keep an event log for every extraction and state update.
- Show confidence labels when matching is uncertain.
- Every outbound message is assumed manual unless user explicitly marks it sent.

## 16. MVP Scope (strict)
Must-have:
- Telegram screenshot intake
- profile extraction
- chat extraction
- manual profile/thread creation
- identity resolution with confidence scores
- opener generation
- reply generation
- simple CRM views
- follow-up reminders

Out of scope for MVP:
- direct Hinge automation
- auto-send
- full web dashboard
- image-based attractiveness scoring sophistication
- perfect OCR on every edge case
- large-scale analytics

## 17. Implementation Phases
### Phase 1 — Foundations
- repo scaffold
- DB schema
- attachment ingestion
- telegram message intake contract
- event log model

### Phase 2 — Ingestion + CRM
- screenshot batch handling
- OCR/extraction pipeline abstraction
- create/update profiles and threads
- basic operator review path

### Phase 3 — Drafting
- opener generator
- reply generator
- concise Telegram output formatting
- send/used tracking

### Phase 4 — Operations
- follow-up scheduler
- stale thread detection
- CRM query commands
- priority summaries

### Phase 5 — Quality
- confidence improvements
- style personalization
- duplicate prevention
- better summaries

## 18. Key Design Decision
We optimize for `minimum user friction`, not maximum autonomy.
The product should feel like:
- screenshot in
- answer out
- context never lost

That is the winning UX for the first usable version.

## 19. Success Metrics
- time from screenshot batch to suggested opener < 20s
- time from reply screenshots to suggested response < 20s
- user effort per profile decision drastically reduced
- no thread confusion across concurrent chats
- high acceptance rate for recommended drafts

## 20. Immediate Next Build Steps
1. Create repo structure.
2. Define DB schema.
3. Define Telegram intake payload model.
4. Build a local fake-ingestion path for manual testing.
5. Add OCR/extraction adapter interface.
6. Add first CRM query endpoints/commands.
