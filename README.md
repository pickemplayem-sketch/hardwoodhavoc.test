# Pickem, Playem, Survive and Win! (Staging)

This is a deployable staging build for the NCAA Men's March Madness fantasy points pool.
- Invite-only or public toggle (Admin)
- Team builder (7 players; 5 active per round)
- Sweet Sixteen redraft
- Leaderboard
- Rules & Terms pages
- Year-config + fast-forward simulation using March 2025 **sample** data

## Quick Deploy (Render.com)
1) Create a free Render account at https://render.com
2) Click **New** → **Web Service**
3) Connect this repo or upload the ZIP
4) Build Command: `npm install && npm run build`
5) Start Command: `npm start`
6) Environment:
   - `SESSION_SECRET` = any random string
   - `ADMIN_INVITE_CODE` = MARCH2025-ADMIN
   - `PLAYER_INVITE_CODE` = MARCH2025
   - `GAME_PUBLIC` = false   (true to allow open signup without codes)
   - `TOURNAMENT_YEAR` = 2025
7) Click **Deploy**

Admin (default):
- user: CSK
- pass: TestAdmin!234

You can change these in `server/seed.js` or via the Admin panel.

### Swap in full 2025 dataset later
Replace `server/data/players_2025.json` with a full dataset that includes:
[
  {
    "id": "duk-01",
    "name": "John Doe",
    "school": "Duke",
    "seed": 2,
    "position": "G",
    "ppg": 17.3,
    "three_pa": 180,
    "three_pm": 68,
    "three_pct": 0.378,
    "round_points": { "R64": 18, "R32": 22, "S16": 14, "E8": 11, "F4": 17, "CH": 9 }
  },
  ...
]

The scoring engine sums **active players' `round_points`** per round.
