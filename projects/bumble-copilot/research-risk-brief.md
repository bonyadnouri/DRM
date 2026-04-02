# Bumble automation risk brief for Telegram-first CRM/copilot

## Bottom line
A **low-risk MVP should stay off-platform**: Telegram + local CRM + draft generation + reminders + manual/semi-manual intake.

A **higher-risk build would directly control Bumble** (scraping, reverse-engineered API use, browser/mobile automation, auto-swiping, auto-sending). Based on Bumble’s published rules, that is the part most likely to trigger bans or policy violations.

## Why this is risky
Bumble’s own published policies are unusually relevant here:

- **Platform manipulation is explicitly prohibited.** Bumble says it does not allow "unauthorized automated behaviors" including **scraping, scripting, or artificially influencing connections or interactions**, including automations that may interact with **profiles or messages**.
- **Automation for matches is explicitly called out.** Bumble’s own help/article says: "using automation or scripting to make matches on Bumble isn’t allowed."
- **Inauthenticity / account control rules matter.** Bumble says it does not allow impersonation, misrepresentation, or **allowing someone else to have access to -or control of- an account that does not represent them**.
- **Enforcement is real.** Bumble says it uses **automated systems + human moderation**, may terminate/suspend accounts, restrict access, and can use operational/technological/legal means including **blocking IPs**.
- **Ban evasion is also prohibited.** Bumble says creating new accounts or using **VPNs or other methods to circumvent a restriction or ban** is not allowed.

## Practical interpretation
The dangerous line is not "AI exists"; Bumble itself ships some AI-assisted features (for example AI-powered icebreakers in Bumble For Friends). The dangerous line is **third-party automation that drives Bumble actions or fakes authenticity/control**.

That suggests a clear boundary:

- **Safer:** help the user think, draft, organize, prioritize, remember, and prepare.
- **Risky:** make Bumble app actions happen automatically, harvest data at scale, or let the system act like the user without their live involvement.

## Risk tiers

### Green / relatively low risk
These are the best MVP candidates.

- **Telegram-first CRM** for leads/matches/conversations
- **Draft suggestions** for openers and replies
- **Approval queue** where Bonyad reviews before sending manually
- **Pipeline tracking**: matched / replied / number exchanged / date proposed / dormant
- **Style guide / personalization** based on Bonyad’s preferences
- **Manual intake** via copy/paste, notes, or screenshots voluntarily provided by the user
- **OCR/transcription of user-supplied screenshots** processed locally to extract profile/chat text
- **Reminders / follow-up recommendations / prioritization**

Why low risk: these features do not need direct Bumble automation and can be framed as a decision-support tool around the app.

### Yellow / moderate risk
Possible, but only with strict boundaries.

- **Semi-manual import helpers** that process screenshots, shared text, or exported notes into CRM records
- **Local desktop/mobile helper** that prepares a draft for the user to paste into Bumble
- **One-click copy-to-clipboard** or "ready to paste" reply workflows
- **User-initiated session summaries** (e.g. after Bonyad opens Bumble and shares current state)

Conditions:
- user must initiate intake
- no background polling of Bumble
- no automated clicking/swiping/sending
- no hidden or scheduled access to the Bumble account
- no pretending the system itself is the dating persona

### Red / high risk / should not be MVP
I would avoid these unless Bonyad explicitly accepts meaningful ban risk.

- **Browser/mobile automation** that swipes, likes, matches, sends messages, opens chats, or navigates Bumble
- **Reverse-engineered or unofficial Bumble API usage**
- **Scraping profiles/messages** from the app or web client
- **Scheduled/background account access**
- **Auto-send replies** without live user review
- **Mass triage/swiping at machine speed**
- **Multi-account workflows**
- **VPN/device/account rotation to reduce detection**
- **Anything that evades bans/restrictions**
- **Fake/AI-generated personas, deceptive photos, or autonomous romantic impersonation**

## Recommended safe architecture boundary

### Good boundary for v1
**Bumble remains a human-operated interface.**
The copilot lives outside it.

Recommended shape:
1. **Telegram = command + approval surface**
2. **Local workspace/database = CRM + memory + prompts + analytics**
3. **Intake = manual copy/paste, forwarded screenshots, or explicit user-submitted notes**
4. **Output = suggested text, next actions, reminders, and summaries**
5. **Final send on Bumble = human does it**

### Important design rule
Do **not** store credentials for direct Bumble login in the MVP.
Do **not** build the product around continuous direct access to the Bumble session.

That keeps the architecture aligned with both:
- project goal: reduce mental load
- project constraint: minimize platform ban/detection risk

## Recommended MVP scope
If the goal is "useful fast, low-risk," I’d ship:

1. **Lead/match CRM**
   - profile nickname/name
   - basic attributes user entered or imported from screenshots
   - stage
   - last contact date
   - notes
   - next recommended action

2. **Reply/opener drafting**
   - tailored to Bonyad’s style
   - short / playful / direct variants
   - approval-based

3. **Follow-up engine**
   - remind when a conversation is stale
   - suggest date escalation when signals are good
   - suggest archive/pass when dead

4. **Manual/semi-manual intake flow**
   - send screenshot(s) or text into Telegram
   - parse into structured CRM entry
   - ask clarifying question only when needed

5. **Conversation memory**
   - summarize prior chat themes
   - track facts to avoid repetitive questions
   - generate personalized next-message suggestions

## What I would explicitly avoid in MVP docs/code
- words like "autopilot," "auto-send," "auto-match," "scrape Bumble," or "bot account"
- anything that implies the system takes over Bumble directly
- any deceptive persona simulation where the app is effectively pretending to be Bonyad end-to-end

The right positioning is **copilot / CRM / drafting assistant**, not **automation bot**.

## If automation is explored later
Treat it as a separate post-MVP research track with explicit risk acceptance.

Before doing it, require:
- a fresh policy re-check
- a written internal decision that account loss is acceptable
- very small-scope experiments
- no ban-evasion measures
- no autonomous sending

Frankly, I suspect this may be **negative expected value** versus just making the off-platform copilot really good.

## Sources reviewed
- Bumble Terms and Conditions: `https://bumble.com/en/terms`
- Bumble Community Guidelines: `https://bumble.com/guidelines/`
- Bumble Inauthentic Profiles guideline: `https://bumble.com/en/guidelines/inauthentic-profiles`
- Bumble article "What Will Get You Kicked Off of Bumble?": `https://bumble.com/the-buzz/what-will-get-you-kicked-off-bumble`
- Bumble For Friends AI-powered icebreakers article: `https://bumble.com/the-buzz/bumble-for-friends-ai-powered-icebreakers`

## My recommendation
**Proceed with a Telegram-first dating copilot that never directly operates Bumble in MVP.**

That gives most of the value:
- lower mental overhead
- better replies
- better follow-up discipline
- centralized match memory

without stepping into the part Bumble is most likely to punish: **unauthorized automation, scraping, scripting, and account control.**
