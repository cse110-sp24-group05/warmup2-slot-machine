# Changes — Iteration 08

Balances payouts and improves fairness for the 3-payline system introduced in
iteration 07. Fixes a script-loading bug that prevented all interactivity when
the page was opened via the `file://` protocol, corrects the token-bar grid
layout, and eliminates a systematic rounding loss in per-line bet calculation
that reduced effective RTP below the theoretical 96.50%.

---

## Change #1 — Fix script loading (clickability bug)

**What it does:** Replaces `<script type="module">` with `<script defer>` so
the page works when opened directly from the filesystem.

**Why:** ES module scripts loaded via `file://` are blocked by the browser's
CORS policy — the script silently fails to execute, so no event listeners
attach and nothing on the page is clickable. The code does not use `import`
or `export`, so `type="module"` provided no benefit beyond deferred execution
and strict mode. `defer` gives the same deferred execution, and the code is
already strict-mode compatible.

**Verify:** Open `index.html` directly from the file system (double-click).
All buttons, the lever, theme swatches, and bet controls should respond.

---

## Change #2 — Fix per-line bet rounding loss

**What it does:** Changes `lineBet` from `Math.floor(bet / 3)` (integer) to
`bet / 3` (float). Only the final per-line payout is floored. A minimum
payout of 1 token is guaranteed for any winning payline.

**Why:** The integer floor lost up to 2 tokens per spin. For bet=10,
`Math.floor(10/3) = 3`, so only 9 of 10 tokens were effectively wagered —
a hidden ~10% loss on top of the house edge. With fractional lineBet, the
full bet amount participates in payout calculation, preserving the
theoretical 96.50% RTP across all bet sizes. The `Math.max(1, ...)` guard
ensures that very small bets (1–2 tokens) still produce a minimum 1-token
win on any matching payline, so low-stakes play remains viable.

**Verify:** Set bet to 10 and spin until a pair lands on one line. The
payout should be `Math.floor(10/3 * 2) = 6` tokens. Previously it was
`Math.floor(3 * 2) = 6` — same here, but for bet=11 the new code pays 7
instead of 6, eliminating the rounding gap.

---

## Change #3 — Fix token-bar grid layout

**What it does:** Changes `.token-bar` grid from `repeat(4, 1fr)` to
`repeat(5, 1fr)` so all five stat cards (balance, won, burned, spins,
session RTP) display in a single row.

**Why:** Iteration 06 added the session RTP card as a 5th item but the grid
was never updated from 4 columns, causing the RTP card to wrap to a second
row and misalign.

**Verify:** The token bar should show all five stats in one horizontal row.

---

## Change #4 — Fix symbol probability documentation

**What it does:** Corrects the `weightedSymbol()` JSDoc to use the actual
TOTAL_WEIGHT of 57 (not 54) and adds the three special symbols (WILD,
SCATTER, MULTIPLIER) that were missing from the probability table.

**Why:** The JSDoc listed probabilities based on a total weight of 54, which
was stale from before the special symbols were added. This caused the
documented probabilities to be inaccurate (e.g., DIAMOND was listed as
1.85% but is actually 1.75%).

---

## Files changed

- `src/iterations/iteration08/index.html` — `type="module"` replaced with `defer`
- `src/iterations/iteration08/script.js` — fractional lineBet with min-1
  payout guard, REEL_ROWS usage in payline construction, corrected
  probability JSDoc
- `src/iterations/iteration08/styles.css` — token-bar grid 4 to 5 columns
- `src/iterations/iteration08/changes.md` — this file
