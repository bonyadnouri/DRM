# Project Plan

## Objective
Build a Telegram-first Bumble Copilot / Dating CRM that reduces Bonyad's effort while keeping high-risk actions gated.

## Desired user experience
Bonyad chats with Arian on Telegram as the main interface. Arian:
- keeps track of leads/matches
- proposes next actions
- drafts openers/replies in Bonyad's style
- requests approval where needed
- surfaces only important decisions and updates

## Constraints
- Must minimize platform ban/detection risk
- Must preserve a coherent style aligned with Bonyad
- Must support asynchronous progress while Bonyad is away
- Must keep important state in files/data, not only chat context

## Phase 0: Foundation (now)
- establish project docs
- define working mode
- research risk constraints
- define architecture

## Phase 1: MVP spec
- define lead/match schema
- define pipeline states
- define message drafting/approval flow
- define Telegram command/update model
- decide initial input path (manual/semi-manual)

## Phase 2: MVP build
- local project scaffold
- storage layer
- CRM views/commands
- suggestion engine
- approval workflow

## Phase 3: Intake automation
- safe ingestion path from Bumble
- profile triage helpers
- opener queue

## Phase 4: Optimization
- better style adaptation
- prioritization/scoring
- metrics and review loops

## Proposed operating cadence
- Arian proceeds autonomously on research/design/build tasks
- Arian sends updates on milestones/blockers/decisions
- Bonyad only intervenes on meaningful decisions or approvals
