# Changes — Iteration 03

Fixes two remaining functional bugs from `iteration01/bugs.md` and addresses
three code smells to improve stability and maintainability.

---

## Bug #4 — Near-miss detection logic was unreachable

**Original bug:** `checkNearMiss` looked for two identical high-value symbols
(e.g. DIAMOND + DIAMOND + junk), but `calcPayout` already returns `type: 'pair'`
for any two matching symbols. Since `checkNearMiss` is only called when
`type === 'lose'`, its condition could never be true — the function was dead code.

**What changed**

Redefined near-miss to fire when `type === 'lose'` and at least two of the three
symbols are high-value (DIAMOND, MONEY, or AGI), even if the two high-value
symbols are different from each other. For example: DIAMOND + MONEY + TOKEN is
now a near-miss. The visual presence of multiple rare symbols without any payout
creates a meaningful "so close" moment.

Added a detailed JSDoc comment explaining exactly when and why the function fires.

**Reproduce / verify**

1. Open the game and spin repeatedly until you see two rare symbols (DIAMOND,
   MONEY, or AGI) land without forming a pair or combo.
2. **Before the fix:** this showed as a normal loss with no special feedback.
3. **After the fix:** the result shows "NEAR MISS" badge, shake animation plays,
   near-miss sound triggers, and the high-value reels get highlighted.
4. Pairs of any kind (including high-value) still show as pairs with half-back
   payout — near-miss only fires on actual losses.

---

## Bug #5 — Progressive jackpot did not persist on page reload

**Original bug:** the progressive jackpot grew each spin but reset to 5,000 on
page reload. Accumulated jackpot progress was lost.

**What changed**

- New `loadProgressiveJackpot()` reads from `localStorage` on init, falling back
  to `INITIAL_JACKPOT` if no saved value exists or the stored value is invalid.
- New `saveProgressiveJackpot()` writes to `localStorage` after every update.
- `updateProgressiveJackpot()` now calls `saveProgressiveJackpot()` after each
  increment.
- `resetProgressiveJackpot()` now calls `localStorage.removeItem()` to clear the
  persisted value on game reset.
- All localStorage access is wrapped in try/catch for environments where storage
  is unavailable.
- The localStorage key is defined as a named constant (`JACKPOT_STORAGE_KEY`).

**Reproduce / verify**

1. Open the game and spin ~5 times (all losses grow the jackpot).
2. Note the jackpot value in the progressive bar.
3. Refresh the page.
4. **Before the fix:** jackpot resets to 5,000.
5. **After the fix:** jackpot retains its accumulated value.
6. Click "Refill context" (reset) — jackpot resets to 5,000 and localStorage is
   cleared.
7. Refresh again — jackpot stays at 5,000 (no stale value persisted).

---

## Smell #7 — Replaced all `var` with `let`/`const`

Converted every `var` declaration in script.js to `const` (for values that are
never reassigned) or `let` (for mutable bindings). Zero `var` declarations
remain.

**Verify:** `grep -c 'var ' script.js` returns 0.

---

## Smell #8 — Replaced magic numbers with named constants

Added named constants at the top of script.js:

| Constant                   | Value      | Replaces                           |
|----------------------------|------------|------------------------------------|
| `CELL_HEIGHT`              | 96         | Hardcoded cell height in animation |
| `INITIAL_JACKPOT`          | 5000       | Starting jackpot value             |
| `STARTING_BALANCE`         | 1000       | Initial player balance             |
| `JACKPOT_CONTRIBUTION_RATE`| 0.08       | % of bet added to jackpot on loss  |
| `BONUS_WHEEL_INTERVAL`     | 10         | Spins between bonus wheel triggers |
| `HISTORY_DISPLAY_LIMIT`    | 8          | Max entries in transaction history  |
| `MAX_CUSTOM_FUNDS`         | 10000000   | Maximum custom fund amount         |
| `JACKPOT_STORAGE_KEY`      | string     | localStorage key for jackpot       |

All previous hardcoded uses of these values now reference the constants.

**Verify:** `grep -n 'CELL_HEIGHT\|INITIAL_JACKPOT\|STARTING_BALANCE' script.js`
shows constants defined at top and referenced throughout.

---

## Smell #10 — Input sanitization on custom funds

**Original smell:** `confirmCustomFunds` used `parseInt()` which silently accepts
leading garbage (e.g. "100abc" parses as 100). Invalid input caused the button to
silently do nothing with no user feedback.

**What changed**

- Replaced `parseInt()` with `Number()` + `Number.isFinite()` + `Number.isInteger()`
  for strict validation. "100abc", "12.5", empty string, etc. are all rejected.
- Added `<div id="custom-funds-error">` to the funds modal in index.html.
- Added CSS styling (`.custom-funds-error`) matching the existing bet-adjust-note
  pattern — subtle red mono text that fades in.
- `confirmCustomFunds()` now shows specific error messages:
  - "Enter a whole number." for non-numeric / non-integer input.
  - "Amount must be between 1 and 10,000,000." for out-of-range values.
- Error clears automatically when the user types, or when the modal opens/closes.

**Reproduce / verify**

1. Open the custom funds modal (click "Custom" button).
2. Type "abc" and click Add — error "Enter a whole number." appears in red.
3. Type "12.5" and click Add — same error (decimals rejected).
4. Type "100abc" and click Add — same error (no partial parsing).
5. Type "0" and click Add — "Amount must be between 1 and 10,000,000."
6. Type "500" and click Add — funds added, modal closes, no error.
7. Reopen modal — error is cleared.

---

## Files changed

- `src/iterations/iteration03/script.js` — all bug fixes and code smell changes
- `src/iterations/iteration03/index.html` — added `#custom-funds-error` element
- `src/iterations/iteration03/styles.css` — added `.custom-funds-error` styles
- `src/iterations/iteration03/changes.md` — this file
