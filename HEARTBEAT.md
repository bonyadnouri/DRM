# Heartbeat tasks

When triggered by a heartbeat poll:

1. Check whether the Hinge Copilot CRM build is actively in progress.
2. If yes, send a concise progress update to the user including:
   - current focus
   - what was completed since the last meaningful update
   - any blocker (only if real)
   - next step
3. Keep the update brief and Telegram-friendly.
4. After the update, continue autonomous work if there is an obvious next build step.
5. If there is nothing meaningful to report, reply exactly: HEARTBEAT_OK

Do not repeat identical updates unless something actually changed.
