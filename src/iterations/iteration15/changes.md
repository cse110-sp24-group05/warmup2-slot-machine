# Iteration 15 Changes

- **Spin History Panel**:
  - Added a **History** button (`#history-btn`) fixed to the **bottom-left corner** of the screen.
  - Clicking the button opens a modal (`#history-modal`) displaying a scrollable list of the player's recent spins.
  - Each history entry shows: spin number, symbols landed (emoji display), bet size, win/loss amount, and timestamp.
  - Entries are colour-coded by result type (jackpot = gold left border, big win = orange, win = green, pair = blue, loss = red).
  - History is capped at **100 entries** — when the 101st spin occurs, the oldest entry is removed to make room.
  - History resets when the player clicks Refill (reset).

- **Session Stats Panel**:
  - Added a **Stats** button (`#stats-btn`) next to the History button in the bottom-left corner.
  - Clicking it opens a modal (`#stats-modal`) with a 3×2 grid of stat cards:
    - **Total Spins** — how many times the player has spun the machine.
    - **Average Bet** — mean bet size across all spins in the session.
    - **Biggest Win** — the single largest payout received.
    - **Total Won** — cumulative chips won.
    - **Total Burned** — cumulative chips lost.
    - **Net Profit** — total won minus total burned, colour-coded green (positive) or red (negative).
  - Stats are computed live each time the modal is opened, so values are always current.
  - Stats reset when the player clicks Refill (reset).

- **Tracking Implementation**:
  - Added `STATE.biggestWin` and `STATE.totalBetSum` to the game state object.
  - Modified `addHistory()` to enforce the 100-entry cap and update `biggestWin` / `totalBetSum` on every spin.
  - Modified `resetGame()` to clear `biggestWin` and `totalBetSum` alongside the existing state reset.
  - Added `history-modal` and `stats-modal` to the `anyBlockingModalOpen()` check so autoplay pauses while either panel is open.

- **No existing features changed** — the RNG, payout logic, animations, autoplay, fast spin, bonus wheel, sound, speech, and all other game behaviour are untouched.

- **Files touched (iteration 15 only)**:
  - `index.html` — added bottom-left button container (`.bottom-left-btns`), `#history-modal`, and `#stats-modal`.
  - `script.js` — added `STATE.biggestWin` + `STATE.totalBetSum`, capped history at 100, added `openHistoryModal`, `closeHistoryModal`, `openStatsModal`, `closeStatsModal` plus event bindings, updated `resetGame` and `anyBlockingModalOpen`.
  - `style.css` — added styles for `.bottom-left-btns`, `.bottom-panel-btn`, `.history-box`, `.history-row` variants, `.stats-box`, `.stats-grid`, `.stats-card`.
  - `changes.md` — this file.
