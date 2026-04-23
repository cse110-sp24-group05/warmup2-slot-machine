# Iteration 20 Changes — Social & Multiplayer Engagement

## Overview
Added social/multiplayer engagement features: leaderboard, arena battle mode, chip sending, friend invites, and social missions. All changes are contained within `src/iterations/iteration20/`.

---

## index.html

### New Buttons
- Added `#leaderboard-btn` ("🏅 Board") to `.bottom-left-btns` panel
- Added `#arena-btn` ("⚔️ Arena") with `.arena-btn` class to `.bottom-right-btns` panel

### Stats Modal
- Added `#stat-best-streak` and `#stat-cur-streak` stat cards (best/current win streak)
- Stats grid now shows 8 cards total

### Settings Modal
- Added player name input (`#setting-player-name`) and save button (`#save-player-name-btn`)

### New Modals
1. **Leaderboard Modal** (`#leaderboard-modal`)
   - Tabs: Friends / World
   - Sort by: Won / Level / Streak / Spins
   - `#lb-list` for rendered rows
   - Send chips button per friend row
   - `#lb-copy-invite-btn` to copy invite link

2. **Arena Modal** (`#arena-modal`) — 3-phase UI
   - Lobby: room code display, copy button, participant cards, stake selector (10/25/50/100/250), pool display, Start Battle button
   - Battle: spinning animation list per player
   - Results: outcome message, ranked result list, pool prize amount, Play Again button

3. **Send Chips Modal** (`#send-chips-modal`)
   - Recipient display, preset amounts (50/100/250/500), custom amount input, confirm/cancel

---

## style.css

### Additions (appended after iteration 19 styles)
- `.arena-btn` glow animation (`@keyframes arenaGlow`) for arena button
- `.settings-name-row` / `.settings-name-input` / `.settings-name-save-btn` — player name setting row
- Leaderboard styles: `.leaderboard-box`, `.lb-tabs`, `.lb-tab`, `.lb-sort-row`, `.lb-sort`, `.lb-list`, `.lb-row`, `.lb-row-me`, `.lb-rank`, `.lb-avatar`, `.lb-info`, `.lb-name`, `.lb-sub`, `.lb-stat`, `.lb-send-btn`, `.lb-footer`, `.lb-invite-btn`
- Arena styles: `.arena-box`, `.arena-room-bar`, `.arena-room-code`, `.arena-copy-btn`, `.arena-participants`, `.arena-player-card`, `.arena-player-card-me`, `.arena-stake-section`, `.arena-stake-btns`, `.arena-stake-btn`, `.arena-stake-btn.active`, `.arena-pool-display`, `.arena-start-btn`
- Arena battle/results: `.arena-battle-title` (pulse animation), `.arena-battle-card`, `.arena-spin-anim`, `.arena-result-msg`, `.arena-result-win`, `.arena-result-lose`, `.arena-result-row`, `.arena-result-row-winner`, `.arena-result-crown`, `.arena-result-pool`, `.arena-play-again-btn`
- Send chips: `.send-chips-box`, `.send-chips-recipient`, `.send-chips-presets`, `.send-chip-preset`
- Stats grid override: 2-col mobile, 4-col wide for streak cards
- Streak stat cards colored orange

---

## script.js

### STATE Object
- Added `currentWinStreak: 0` and `bestWinStreak: 0` fields

### Daily Missions (DAILY_MISSIONS_DEF)
- Extended from 3 to 5 missions:
  - Mission 4: "Play in Arena mode once" (target: 1, reward: 75 chips)
  - Mission 5: "Send chips to a friend" (target: 1, reward: 50 chips)

### REWARDS Object
- Extended `dailyProgress` and `dailyClaimed` arrays from 3 to 5 elements

### loadRewards()
- Backward-compatible: pads old 3-element saves to 5 elements on load

### updateRewardProgress()
- Resets to 5-element arrays on new day
- Handles `data.playedArena` flag for arena mission
- Handles `data.sentChips` flag for send-chips mission

### openStatsModal()
- Reads `STATE.bestWinStreak` → `#stat-best-streak`
- Reads `STATE.currentWinStreak` → `#stat-cur-streak`

### anyBlockingModalOpen()
- Added `'leaderboard-modal'`, `'arena-modal'`, `'send-chips-modal'` to blocking list

### spin()
- Tracks win streaks after each spin:
  - Win: `currentWinStreak++`, update `bestWinStreak` if exceeded
  - Loss: `currentWinStreak = 0`

### resetGame()
- Resets `STATE.currentWinStreak = 0` and `STATE.bestWinStreak = 0`

### openSettingsModal()
- Loads current player name into `#setting-player-name` input

### Player Identity System (new)
- `getOrCreatePlayerId()` — creates/loads persistent UUID from localStorage
- `getPlayerName()` / `setPlayerName()` — player display name (max 24 chars)
- `MY_PLAYER_ID` — module-level player ID constant

### Simulated Friends (new)
- `SIMULATED_FRIENDS` — array of 8 simulated team members with stats
- `generateWorldPlayers()` — deterministic generator for 50 world leaderboard entries

### Leaderboard System (new)
- `getLBPlayerData()` — builds current player's leaderboard entry from STATE
- `getSortedLBData()` — merges player + friends/world, sorts by selected metric
- `renderLeaderboard()` — renders `.lb-row` items with rank, avatar, name, stat, send button
- `openLeaderboardModal()` / `closeLeaderboardModal()` — modal open/close
- Tab switching (Friends/World) via `.lb-tab` click
- Sort switching (Won/Level/Streak/Spins) via `.lb-sort` click
- Copy invite link via `#lb-copy-invite-btn`

### Send Chips System (new)
- `SEND_CHIPS_FRIEND_ID` — tracks who chips are being sent to
- `openSendChipsModal(friendId)` — populates recipient, clears form, opens modal
- `closeSendChipsModal()` — hides modal, clears state
- `confirmSendChips(amount)` — deducts from balance, shows toast, triggers `sentChips` mission progress
- Preset buttons (50/100/250/500) and custom amount input

### Arena System (new)
- `ARENA_STATE` — tracks roomCode, phase (lobby/battle/results), stake, opponents, results
- `ARENA_WIN_RANK` — maps win types to numeric rank for winner determination
- `generateRoomCode()` — 6-char crypto-random room code
- `getArenaOpponents()` — selects 3 random friends via crypto shuffle
- `openArenaModal()` — initializes arena state, shows lobby phase
- `closeArenaModal()` — hides modal
- `resetArenaToLobby()` — resets to lobby phase UI
- `renderArenaParticipants()` — shows player cards in lobby
- `updateArenaPool()` — computes and displays pool = stake × participants
- `updateArenaStakeUI()` — highlights active stake button
- `simulateOpponentSpin()` — runs real `weightedSymbol()` + `calcPayout()` for each AI opponent
- `startArenaBattle()` — deducts stake, transitions to battle phase, resolves after 2.2s delay
- `renderArenaBattle()` — shows "spinning…" animation cards during battle
- `resolveArenaBattle()` — spins for all players, ranks by win type + multiplier, awards pool to winner, updates STATE, triggers mission progress
- `renderArenaResults()` — shows ranked results with symbols, win type badge, crown on winner
- Event listeners: stake buttons, start button, copy code, play again, close

### URL Invite System (new)
- `buildInviteLink(roomCode?)` — generates `?ref=CODE` URL (+ optional `?room=CODE`)
- `checkInviteUrl()` — on page load, awards +100 chips if `?ref=` param present
- Called in init section after all systems initialize

### Settings: Save Player Name
- Event listener on `#save-player-name-btn` calls `setPlayerName()` and shows toast
