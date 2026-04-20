# Fixes — Iteration 02

Three bugs from `src/iterations/iteration01/bugs.md` fixed in this iteration.
All other bugs and code smells are intentionally left for later iterations.

---

## Bug #2 — Bet input not re-clamped after balance changes

**Original bug:** if balance dropped below the current bet (e.g. balance drops
to 5 while bet input still shows 50), the next spin would fail silently with
"Insufficient tokens." There was also no affordance when balance hit 0.

**What changed**

- New helper `reclampBet()` reads the bet input, clamps to
  `min(currentBet, balance)` (min 1), and reports whether the value was
  adjusted. Balance = 0 parks the input at 1.
- New helper `updateSpinAvailability()` disables the spin button, bet
  presets, and bet input whenever balance is 0. It no-ops while the
  `spinning` lock is active so it never races the spin/unlock toggle.
- New helpers `showBetAdjustNotice()` and `clearBetAdjustNotice()` manage a
  dedicated notice element under the bet input (HTML id `bet-adjust-note`,
  subtle red mono text styled in `styles.css`). Kept out of the main message
  box so it doesn't clobber the spin result text.
- Called after every balance change: `spin()` (after payout settles),
  `addFunds()`, `awardWheelPrize()`, `resetGame()`, and once at init. The
  bet input's `input`/`change` handlers and the bet-preset setters also
  clear the notice when the user manually changes the bet.

**Reproduce / verify**

1. Start a fresh game (balance 1000). Set bet to 500 via the preset.
2. Lose two spins in a row. After the second spin, balance = 0.
3. **Before the fix:** bet input stayed at 500, spin button was still
   enabled; clicking it showed "Insufficient tokens" silently.
4. **After the fix:** bet input is re-clamped to 1, the note
   "Bet auto-adjusted from 500 to 1 — balance too low." appears under the
   bet input, and the spin button (+ presets + bet input) are disabled
   until the player clicks an "Add Tokens" button or "Refill context."
5. Partial-win case: balance 100, bet 100. One spin → pair payout (×0.5)
   → balance 50. Bet input is auto-adjusted to 50 with the notice; spin
   still enabled.
6. Add tokens or reset → notice clears, spin re-enables.

---

## Bug #1 — `totalBurned` misleadingly included partial-loss tokens

**Original bug:** on a pair (×0.5) the code did
`totalBurned += Math.max(0, bet - winAmt)`, counting the net loss as
"burned" even though the player got half back. The `burned` stat was
inflated.

**What changed**

In `spin()`, dropped the `else` branch that added
`Math.max(0, bet - winAmt)` to `totalBurned`. The stat now only increments
when the result type is `lose` (no payout at all). Near-misses still count
as full losses (they enter this branch as `type === 'lose'` before the
later `type = 'nearmiss'` override for styling). Wins and pairs no longer
contribute.

No UI label rename was required: "burned" now genuinely means "tokens lost
with zero payout," which is what players would naturally read it as. The
history row still displays pair results with the `+X (½)` delta, so pair
tokens are still visible in the transaction log — just not in the burned
stat.

**Reproduce / verify**

1. Start a fresh game. Bet 100.
2. Keep spinning until you get a pair result (×0.5, shown in blue with
   "+50 (½)" in history).
3. **Before the fix:** the `burned` tile incremented by 50 for that pair.
4. **After the fix:** `burned` does not change on pairs or wins — only on
   full losses (where history shows "−100 tok" in red).
5. Sanity: force a losing spin → `burned` increases by the full bet.
6. `won` tile continues to include pair payouts as before (unchanged).

---

## Bug #3 — Visual reel STRIP used equal-frequency symbols while results were weighted

**Original bug:** `STRIP` contained 3 copies of each of 12 symbols (36
equal cells). Actual spin outcomes came from `weightedSymbol()`, which
uses `SYMBOL_WEIGHTS = [1,2,3,5,4,6,6,6,6,5,5,5]`. So the spinning
animation showed rare symbols like DIAMOND/MONEY/AGI flying by just as
often as common ones, making "near-miss" situations look achievable far
more often than they really were.

**What changed**

- `STRIP` is rebuilt at load so each symbol appears `SYMBOL_WEIGHTS[i]`
  times (sum = 54 cells — bounded and close to the original 36). Shuffled
  once after build so common symbols don't clump together visually during
  the animation.
- Added `STRIP_POSITIONS`: a parallel lookup (`map[symIdx] → [stripPos,
  ...]`) computed at load so we don't scan the strip on every spin.
- Added `stripPositionFor(symIdx)`: picks a random STRIP index whose cell
  displays the chosen symbol.
- `spin()` computes strip positions from the weighted symbol indices and
  passes them to `animateReel`. `animateReel`'s `targetIndex` parameter
  was renamed `targetStripPos` (and its JSDoc updated) since it's now a
  STRIP index, not a SYMBOLS index.
- `buildReel` is unchanged — STRIP items are still references into
  `SYMBOLS`, so `s.sym` / `s.lbl` still work.

**Reproduce / verify**

1. Open the page. Click the spin button (or pull the lever) and watch the
   reels while they spin.
2. **Before the fix:** DIAMOND, MONEY, and AGI appeared as frequently as
   any other symbol during the blur — every 12-cell stretch contained one
   of each.
3. **After the fix:** DIAMOND (weight 1) appears once per 54 cells of
   strip; MONEY (2) twice; POWER/STORAGE/TOKEN/METRICS (6) six times each.
   Visually the rare symbols feel noticeably rarer — matching the actual
   probability of them landing.
4. Final result frequency is unchanged: `weightedSymbol()` still picks the
   outcome from `SYMBOL_WEIGHTS`. So long-run jackpot/near-miss rates are
   identical to iteration 1 — only the animation now reflects them.
5. Inspect in DevTools: `window.STRIP.length === 54`,
   `STRIP.filter(s => s.lbl === 'DIAMOND').length === 1`,
   `STRIP.filter(s => s.lbl === 'POWER').length === 6`.
