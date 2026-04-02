# Bumble Copilot / Dating CRM

## Goal
Build a system that reduces Bonyad's dating-app mental load by helping with:
- profile triage and like/pass support
- opener generation
- lead/match CRM
- reply suggestion drafts in Bonyad's style
- approval-based sending workflow
- pipeline tracking toward phone number / date

## Non-goals
- No deceptive long-form autonomous romantic impersonation without approval.
- No architecture that ignores platform safety / detection / ban risk.
- No blind full automation before we understand ToS/risk constraints.

## Product shape
A Telegram-first operating model with local tooling:
- Telegram = control room / discussion / approvals / updates
- local workspace = docs, code, state, experiments
- later: optional automation layer for intake / triage / semi-automated actions

## Working principles
1. Optimize for Bonyad's low mental overhead.
2. Keep Bonyad in the loop for critical decisions.
3. Prefer semi-automation before full automation.
4. Be careful about ban risk and detection surfaces.
5. Store project knowledge in files, not just chat.

## Initial workstreams
1. Product & workflow design
2. Platform/risk research
3. Technical architecture
4. Telegram operating model
5. MVP implementation plan

## Near-term MVP hypothesis
First useful version:
- CRM for matches/leads
- message drafting engine
- approval queue
- status pipeline
- manual or semi-manual Bumble intake

## Open questions
- How exactly will Bumble data enter the system?
- Browser automation vs manual export vs assisted copy/paste?
- What approval UX should Telegram use?
- What degree of automation is acceptable vs risky?
- What rules define Bonyad's style and matching preferences?
