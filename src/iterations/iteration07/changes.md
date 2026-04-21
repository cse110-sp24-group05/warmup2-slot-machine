# Changes — Iteration 07

Implements a 3-row reel display with 3 active horizontal paylines. Each spin
now shows a 3×3 grid of symbols (3 reels × 3 visible rows). All three rows
are evaluated as independent paylines at `Math.floor(bet / 3)` tokens each.
Winning paylines are highlighted with colour-coded row overlays and numbered
sidebar markers. Informed by `plan/research-overview.md` which calls for
"win conditions (paylines or matching system)" and notes that "ways-to-win
systems where any matching symbols on adjacent reels count as a win" are
preferred over a single fixed payline.

---

## Change #1 — 3-row reel display

**What it does:** Each reel now shows three symbols simultaneously (top,
center, bottom) instead of one. The center row is the primary payline from
previous iterations; the top and bottom rows are the STRIP positions
immediately above and below the chosen symbol.

**How it works:**

`buildReel()` is refactored to use a new `makeReelCell()` helper (extracted
from the old inline cell-building code, preserving the JSDoc and DOM-safe
approach). It also prepends one phantom cell (mirroring `STRIP[STRIP.length-1]`)
and appends one (mirroring `STRIP[0]`), so the top and bottom rows always have
a valid symbol even when the chosen position is at the very start or end of
the STRIP. The phantom cells allow the scroll offset formula to remain
unchanged — the existing `targetStripPos * CELL_HEIGHT` offset still places
the chosen symbol in the center slot of the 288px viewport.

`animateReel()` is updated to use `totalCells = STRIP.length + 2` so its
modulo-based scroll loop wraps across the full extended strip (including
phantoms).

`STRIP_SYMBOL_IDX` is a new pre-computed lookup array that maps each STRIP
position to its index in `SYMBOLS`, enabling fast adjacent-row lookups without
repeated `indexOf` calls on every spin.

`getRowSymbolIndices(stripPositions)` uses `STRIP_SYMBOL_IDX` to build the
3×3 grid for a given set of center-row strip positions.

**CSS:** `.reel-wrap` height changed from `96px` to `288px`. Row separator
lines added via `::before` and `::after` pseudo-elements at 33.33% and 66.67%
of the reel height. `.reels` `margin-bottom` moved to the new `.reels-area`
wrapper.

**Verify:** After spinning, three symbols should be visible in each reel
column with thin separator lines between them.

---

## Change #2 — 3 active horizontal paylines

**What it does:** All three rows (top, middle, bottom) are evaluated as
paylines each spin. The bet is split evenly: `lineBet = Math.max(1, Math.floor(bet / 3))`.
Each payline is evaluated independently using the existing `calcPayout()`.
Total win = sum of wins across all paylines.

**How it works:**

Payline evaluation is inline in `spin()` after animations complete.
`paylineSymIdx[row]` = array of three symbol indices for that row across all
reels. Each is passed to `calcPayout()`, producing a `paylineResults` array.
The function then aggregates:

- `totalWin` — sum of `Math.floor(lineBet × result.mult)` for each winning line
- `bestType` — highest-ranked win type (jackpot > bigwin > win > pair > lose)
- `bestResult` — the winning result with the highest type rank (drives messages)
- `winningLines` — array of row indices (0, 1, 2) that had a win > 0
- `freeSpinsTotal` — awarded at most once per spin even if multiple lines scatter
- `wildUsedAny`, `multiplierAny`, `scatterAny` — OR across all paylines for sound

Reel border glow (`winner-reel`) and special-symbol highlights (`wild-reel`,
etc.) are applied based on the center payline (row 1) to keep the primary
visual focus consistent. Near-miss is evaluated on the center payline only,
matching prior behavior.

**RTP note:** Each payline has the same theoretical RTP (96.50%) as the
single-line game because it uses the same probability weights and multipliers
at a proportional bet. The `Math.floor` rounding on `lineBet` introduces a
small systematic loss (up to 2 tokens per spin); exact RTP recalibration is
scoped to iteration 8 per the Phase 2 plan.

**Verify:** Spin until a top or bottom row shows a matching combination. The
row highlight and sidebar marker for that line should light up. The message
box should show `[LINE 1]` or `[LINE 3]`. Win amount reflects bet ÷ 3 per line.

---

## Change #3 — Payline sidebar markers

**What it does:** Numbered circles (1, 2, 3) appear on both sides of the reel
panel, aligned with their respective rows. When a payline wins, its number
badges turn green with a glow effect.

**How it works:**

Two `.payline-sidebar` divs flank `.reels` inside the new `.reels-area`
wrapper. Each sidebar contains three `.payline-marker` divs distributed with
`justify-content: space-around` to align with the 3 × 96px rows.

`setPaylineHighlights(winningLines, paylineResults)` iterates over winning
lines, applies the appropriate colour class (`win`, `bigwin`, `jackpot`,
`pair`) to the corresponding `.row-highlight` divs in each reel-wrap, and
toggles `.winning` on the marker elements.

`initReels()` is updated to clear row highlights and marker states at the
start of every spin.

**CSS added:** `.reels-area`, `.payline-sidebar`, `.payline-marker`,
`.payline-marker.winning`, `.row-highlight`, `.row-highlight-top/mid/bot`,
`.row-highlight.win/bigwin/jackpot/pair`.

**Verify:** After a win, the numbered marker(s) matching the winning row(s)
should glow green on both sidebars. A loss leaves all markers dim.

---

## Change #4 — Updated payline indicator lines

**What it does:** Replaced the single `.payline` center line with three named
payline lines (`.payline-top`, `.payline-mid`, `.payline-bot`) positioned at
the center of each visible row.

**How it works:**

Each `.reel-wrap` now contains three `.payline` divs with class variants:
- `.payline-top` at `top: 16.67%` (center of top row)
- `.payline-mid` at `top: 50%` (center of middle row)
- `.payline-bot` at `top: 83.33%` (center of bottom row)

All retain the existing subtle purple tint, `z-index: 2`, and
`transform: translateY(-50%)`.

**Verify:** Three faint horizontal lines should be visible across each reel
column, one per row.

---

## Change #5 — Paytable header update

**What it does:** Adds a clarifying note below the paytable header explaining
the per-line bet splitting and multi-line stacking behavior.

**HTML:** Section title updated to `// paytable — 3 active paylines — RTP: 96.50% per line`.
A `.paytable-note` paragraph reads:
"Payouts apply to bet÷3 per line. Multiple lines can win simultaneously."

**Verify:** The paytable section should show the updated header and note text.

---

## Files changed

- `src/iterations/iteration07/script.js` — REEL_ROWS/ACTIVE_PAYLINES constants,
  STRIP_SYMBOL_IDX lookup, makeReelCell helper, buildReel phantom cells,
  animateReel totalCells fix, getRowSymbolIndices, setPaylineHighlights,
  initReels highlight clearing, spin() payline evaluation replacing single
  calcPayout call
- `src/iterations/iteration07/index.html` — reels wrapped in reels-area with
  payline sidebars, 3 payline divs per reel-wrap, 3 row-highlight divs per
  reel-wrap, updated paytable header and note
- `src/iterations/iteration07/styles.css` — reel-wrap height 288px, reels-area
  wrapper, payline-sidebar/marker styles, row-highlight styles, payline-top/
  mid/bot position classes, row separator pseudo-elements, paytable-note style
- `src/iterations/iteration07/changes.md` — this file
