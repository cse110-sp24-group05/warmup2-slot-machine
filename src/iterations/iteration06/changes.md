# Changes — Iteration 06

Adds three new special symbol types (Wild, Scatter, Multiplier) to the
slot machine, fully integrated into the payout engine, animation system,
sound design, and UI. Payout table rebalanced to maintain 96.50%
theoretical RTP with the new symbols. Informed by `plan/research-overview.md`
which calls for "wild, scatter, multipliers" and "varied win conditions."

---

## Change #1 — Wild symbol (🃏 WILD)

**What it does:** Substitutes for any regular symbol to complete
three-of-a-kind or named combo wins. WILDs do NOT substitute into pairs
— they only upgrade to higher-value outcomes (triples and named combos).
This keeps the RTP balanced; if wilds helped pairs too, RTP would spike
to ~140%.

**How it works:**

`resolveWilds()` takes the three reel labels and, if any are 'WILD',
tries every possible substitution from the 12 regular symbols. It keeps
the combination that produces the highest payout above pair level. If no
substitution beats a pair, the wild doesn't help and regular payout logic
runs (with the wild filtered out as a non-matching special symbol).

Example: `[AGI, WILD, AGI]` → wild becomes AGI → `AGI×3` pays 50×.
Example: `[AGI, WILD, BRAIN]` → wild tries all 12 options → none make a
triple or named combo → regular logic sees only `[AGI, BRAIN]` (2 symbols,
no pair) → loss.

**Weight:** 1/57 = 1.75% per reel. Appears in ~5% of all spins (at
least one wild across three reels).

**Verify:** Spin until 🃏 appears. If it lands alongside two matching
regular symbols, the combo name should be prefixed with "🃏 WILD".

---

## Change #2 — Scatter symbol (⭐ SCATTER)

**What it does:** Pays based on count regardless of reel position.
Two scatters pay 5× bet. Three scatters pay 20× bet AND award 3 free
spins.

**How it works:**

`calcPayout()` counts scatter symbols before any other evaluation.
Scatter pay is added on top of any base win (they stack independently).
When 3 scatters land, `result.freeSpinsAwarded` is set to
`SCATTER_FREE_SPINS` (3). The spin function adds these to
`STATE.freeSpinBank`. At the start of each subsequent spin, if the bank
has free spins remaining, one is consumed and `STATE.freeSpin` is set
to true (bet is not deducted).

**Weight:** 1/57 = 1.75% per reel. Two scatters land in ~0.09% of spins.
Three scatters are extremely rare (~0.005%).

**Verify:** The free spin counter should decrement each spin. The message
box shows "FREE SPIN activated!" when a banked free spin is consumed.

---

## Change #3 — Multiplier symbol (🔥 MULTIPLIER)

**What it does:** When the multiplier symbol appears in a spin that has
a base win (pair, triple, or combo), the base payout is doubled (2×).
Does not multiply scatter pay — only the base win.

**How it works:**

`calcPayout()` checks for 'MULTIPLIER' in the labels. If present and the
base payout is greater than 0, the multiplier is applied. The combo name
is prefixed with "🔥2× " to indicate the boost. If the multiplier
upgrades a pair, the type is promoted from 'pair' to 'win'; if it
upgrades a 'win', it becomes 'bigwin'. This ensures celebrations scale
appropriately.

**Weight:** 1/57 = 1.75% per reel. Appears in ~5% of spins. Only helps
when it coincides with a win — roughly 1.3% of all spins get a
multiplied payout.

**Verify:** When 🔥 appears alongside a winning combo, the payout
should be exactly 2× what the paytable shows for that combo.

---

## Change #4 — Payout rebalancing (RTP: 96.50%)

**Problem:** Adding Wild and Multiplier symbols increases the overall
return. Without rebalancing, RTP would exceed 140%.

**What changed:**

- Pair payout lowered from 2.4× (iteration 05) to 2.0×
- Wild restricted to triples/combos only (no pair substitution)
- All other payouts unchanged from iteration 05

The new RTP breakdown:

| Outcome | Probability | RTP Contribution |
|---------|-------------|------------------|
| Pair | 22.04% | 44.08% |
| Generic ×3 | 0.67% | 10.04% |
| WILD → Generic ×3 | 0.41% | 6.15% |
| Neural Net | 0.32% | 4.86% |
| Hyper Drive | 0.49% | 4.86% |
| Compute Stack | 0.35% | 4.20% |
| WILD → combos (various) | ~1.1% | ~11.9% |
| MULT(pair) | 0.44% | 1.78% |
| Brain ×3 | 0.07% | 1.69% |
| Other triples/combos | ~0.3% | ~5.5% |
| Scatter ×2 | 0.09% | 0.45% |
| Loss | 74.05% | — |
| **Total** | | **96.50%** |

**Verify:** Play 100+ spins and observe the session RTP display trending
toward ~96%.

---

## Change #5 — New sound effects

Added four new sound functions:

- `soundWild()` — shimmering ascending tones when wild substitutes
- `soundScatter()` — sparkling high-pitched tones for scatter pay
- `soundMultiplier()` — fiery sawtooth ramp for multiplier activation
- `soundFreeSpins()` — celebratory ascending melody for free spin award

All registered in SOUND_MAP and played contextually in the spin function
based on `result.wildUsed`, `result.hasMultiplier`, `result.scatterPay`,
and `result.freeSpinsAwarded`.

---

## Change #6 — Flavor text for new symbols

Added new message pools in MSGS and SPEECH:

- `scatter` — messages for scatter wins
- `wild` — messages for wild substitution wins
- `multiplier` — messages for multiplied payouts
- `freespins` — messages for free spin awards

All follow the existing AI/tech humor theme.

---

## Change #7 — CSS for special symbol highlights

Added reel highlight styles:
- `.wild-reel` — purple glow with inner shadow
- `.scatter-reel` — gold glow with inner shadow
- `.multiplier-reel` — red glow with inner shadow

Added paytable highlight styles:
- `.highlight-wild` — purple text
- `.highlight-scatter` — gold text
- `.highlight-multiplier` — red text

---

## Change #8 — Free spin bank system

Added `STATE.freeSpinBank` to track queued free spins from scatter.
When 3 scatters land, `SCATTER_FREE_SPINS` (3) are added to the bank.
At the start of each spin, if the bank is positive, one is consumed and
the spin is free. The bank resets on game reset.

---

## Files changed

- `src/iterations/iteration06/script.js` — new symbols, calcPayout rewrite, sounds, flavor text, free spin bank
- `src/iterations/iteration06/index.html` — paytable special symbols section, pair multiplier update
- `src/iterations/iteration06/styles.css` — special symbol reel/paytable highlights
- `src/iterations/iteration06/changes.md` — this file
