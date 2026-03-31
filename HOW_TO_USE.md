# Team31Hub

## Open It

- Open `C:\Users\Graham Pinnell\Downloads\Team31Hub\index.html` in a browser.
- The app loads the roster, imported Discord receipts, local reports, and future-module ideas from this folder.

## What Works Now

- Search and filter members by room, role, and evidence category.
- Open any member dossier for score, Discord info, recent receipts, and quick actions.
- Review flagged receipt cards with sanitized previews and optional raw reveal.
- File local commendations or conduct reports that save in browser storage.
- Use the reward ladder and leaderboard as a game layer for prizes and room competition.

## Refresh The Data

- Drop new Discord export folders inside `C:\Users\Graham Pinnell\Downloads\Team31Hub\General Files`.
- Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\Graham Pinnell\Downloads\Team31Hub\scripts\build_team31hub_data.ps1
```

- Reload `index.html` after the script finishes.

## Current Gaps

- `Vinny General` did not include an HTML receipt export, so Vinny currently has roster-only data.
- The app is local-first. Reports save per browser/device right now.
- Live Discord sync is not wired yet. That would need a Discord bot, webhook pipeline, or hosted backend.
