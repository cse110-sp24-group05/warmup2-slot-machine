# Changes — Iteration 05

Implements a proper RNG system and rebalances the payout table to achieve
a mathematically verified 95.09% RTP, in line with real slot machine
standards. Informed by `plan/research-overview.md` which specifies RTP
should target ~95%.

---

## Change #1 — Cryptographic RNG replaces Math.random for game outcomes

**Problem:** `Math.random()` uses a PRNG (pseudo-random number generator)
that is predictable if the seed is known. Real slot machines use hardware
RNG for tamper-proof results.

**What changed:**

Added `secureRandom()` — a utility that calls `crypto.getRandomValues()`
to draw from the OS entropy pool. Falls back to `Math.random()` if the
crypto API is unavailable (e.g. very old browsers). All game-critical
random calls now use `secureRandom()`:

- `weightedSymbol()` — symbol selection on each reel
- `stripPositionFor()` — visual reel landing position
- `rnd()` — flavor text / message selection
- Bonus wheel outcome (`targetIdx`, `fullSpins`)
- STRIP shuffle at load time

Visual-only randomness (background nodes, confetti, coin rain, audio
noise buffers) still uses `Math.random()` since it does not affect game
outcomes and crypto overhead is unnecessary there.

**Verify:** `grep -n 'secureRandom' script.js` shows all game-critical
call sites. `grep -n 'Math.random' script.js` shows only visual/audio
uses plus the fallback inside `secureRandom()` itself.

---

## Change #2 — Payout table rebalanced for 95.09% RTP

**Problem:** The previous payout table had a theoretical RTP of only
33.61% — meaning the player lost ~66 cents of every token wagered. Real
slots target 92–96% RTP. The research overview notes "players can tell
when a game feels broken even if they cannot explain exactly why."

**What changed:**

All payout multipliers were recalculated using a probability simulation
across all 1,728 possible symbol combinations (12³), weighted by
`SYMBOL_WEIGHTS`. The new multipliers:

| Outcome | Old Mult | New Mult | Probability | RTP Contribution |
|---------|----------|----------|-------------|------------------|
| Diamond ×3 | 50× | 150× | 0.001% | 0.10% |
| AGI ×3 | 25× | 50× | 0.017% | 0.86% |
| Money ×3 | 20× | 40× | 0.005% | 0.20% |
| Oracle ×3 | 18× | 30× | 0.041% | 1.22% |
| Brain ×3 | 15× | 25× | 0.079% | 1.98% |
| Generic ×3 | 8× | 15× | 0.787% | 11.80% |
| Singularity | 15× | 25× | 0.023% | 0.57% |
| AI Trinity | 12× | 18× | 0.057% | 1.03% |
| Neural Net | 10× | 15× | 0.381% | 5.72% |
| Compute Stack | 8× | 12× | 0.412% | 4.94% |
| Hyper Drive | 7× | 10× | 0.572% | 5.72% |
| Pair | 0.5× | 2.4× | 25.400% | 60.96% |
| Loss | 0 | 0 | 72.23% | — |
| **Total** | | | | **95.09%** |

Key design decisions:
- Pairs are now profitable (2.4× returns more than the bet) rather than
  a consolation (0.5× lost half). This is the biggest RTP driver at
  ~61% of total RTP — consistent with real slots where frequent small
  wins sustain the session.
- Triple payouts roughly tripled across the board. Diamond jackpot went
  from 50× to 150× to create a meaningful top prize.
- Hit frequency stays at 27.77% (unchanged) — roughly 1 in 4 spins
  returns something.
- Symbol weights are UNCHANGED — rarity distribution is preserved.

Multipliers are now stored in a `PAYOUT_TABLE` constant object rather
than as magic numbers inside `calcPayout()`. This makes future
rebalancing straightforward.

**Verify:** Run the RTP simulation in the changes.md derivation, or
play 100+ spins and check the session RTP display converges toward 95%.

---

## Change #3 — Session RTP tracking and display

**Problem:** No way to verify whether the game's actual behavior matches
the theoretical RTP. Players and developers alike benefit from
transparency.

**What changed:**

- Added `STATE.totalWagered` and `STATE.totalReturned` fields that
  accumulate across the session. Updated every spin (free spins excluded
  from wagered since no bet was deducted).
- Added a "session RTP" card to the token bar in `index.html` showing
  the live return-to-player percentage.
- `updateUI()` now calculates and displays `(totalReturned / totalWagered)
  × 100` with color coding — green when near or above target, red when
  significantly below.
- RTP stats reset with the rest of game state in `resetGame()`.

**Verify:** Play 50+ spins. The session RTP display should fluctuate but
trend toward ~95% over a large sample.

---

## Change #4 — Pre-computed TOTAL_WEIGHT constant

**Problem:** `weightedSymbol()` called `.reduce()` on every invocation
to sum the weights array. This is wasteful since the weights never change.

**What changed:**

Added `const TOTAL_WEIGHT = SYMBOL_WEIGHTS.reduce(...)` at the top level.
`weightedSymbol()` now references `TOTAL_WEIGHT` directly instead of
recomputing each spin.

**Verify:** `grep -n 'TOTAL_WEIGHT' script.js` shows the constant and
its usage in `weightedSymbol()`.

---

## Change #5 — Probability documentation in JSDoc

**Problem:** The symbol probabilities were implicit — you had to manually
divide each weight by the total to know the actual odds.

**What changed:**

Added a JSDoc table to `weightedSymbol()` listing every symbol's exact
probability (e.g. DIAMOND: 1/54 = 1.85%). Added doc comments to
`secureRandom()` and `PAYOUT_TABLE`. Added `TARGET_RTP` constant.

---

## Change #6 — Paytable header shows theoretical RTP

**What changed:**

The paytable section title in `index.html` now reads
`// paytable — theoretical RTP: 95.09%` so players can see the game's
fairness at a glance.

---

## Files changed

- `src/iterations/iteration05/script.js` — RNG, payout, RTP tracking
- `src/iterations/iteration05/index.html` — RTP display card, paytable update
- `src/iterations/iteration05/changes.md` — this file
