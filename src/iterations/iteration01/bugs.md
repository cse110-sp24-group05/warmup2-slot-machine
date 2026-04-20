# Bugs & Code Smells — Iteration 01

Issues discovered during the code read-through. **None of these are fixed here** — they are queued for iteration 2.

---

## Bugs

1. **`totalBurned` tracks negative values on wins**
   In `spin()`, on a win the code does `totalBurned += Math.max(0, bet - winAmt)`. When `winAmt > bet` (which is most wins since multipliers are ×7–×50), this adds 0 — correct. But on a pair (×0.5), `bet - winAmt` is positive and gets added to `totalBurned`, even though the player technically got half back. The "burned" stat is thus misleading (it counts the net loss on pairs as fully burned).

2. **Bet input not re-clamped after balance changes**
   If the player's balance drops below their current bet (e.g. balance=5, bet still shows 50), the next spin will fail with "Insufficient tokens" even though the bet *input* looks valid. The bet should be re-clamped after every balance change.

3. **`STRIP` is not weighted — only `weightedSymbol()` is**
   The `STRIP` array (used for the visual reel animation) contains 3 copies of every symbol equally. The actual result comes from `weightedSymbol()`, which uses `SYMBOL_WEIGHTS`. This means the spinning animation shows symbols at equal frequency but the *results* are weighted — a cosmetic mismatch that makes near-misses appear more often in the animation than they should.

4. **Near-miss detection ignores order for two-of-a-kind check**
   `checkNearMiss` checks `a===b`, `b===c`, `a===c` individually but the pair payout in `calcPayout` triggers on the same conditions. So any near-miss on a high-value symbol would actually be caught as a "pair" first in `calcPayout`, making the near-miss check unreachable for those cases. The near-miss detection only fires when `type === 'lose'`, which means two of the same high-value symbol *didn't* match — this is contradictory. In practice it works because `calcPayout` returns "pair" for those, so near-miss never fires for high-value pairs. The intent seems confused.

5. **Progressive jackpot pool is never saved**
   The progressive jackpot grows each spin but resets on page reload. If the user refreshes, they lose accumulated jackpot progress. No localStorage persistence.

---

## Code Smells

6. **All state is global mutable variables**
   `balance`, `totalWon`, `totalBurned`, `spinCount`, `spinning`, `leverActive`, `progressiveJackpot`, `freeSpin`, `speechEnabled`, `spinHistory` — all top-level `var` declarations. Makes testing and reasoning about state transitions difficult.

7. **`var` used everywhere instead of `let`/`const`**
   The entire codebase uses `var` with function-scope hoisting. Should use `const` for immutable bindings and `let` for mutable ones.

8. **Magic numbers throughout**
   - `96` (cell height) hardcoded in `animateReel`
   - `5000` (initial jackpot) in multiple places
   - `1000` (starting balance) in multiple places
   - `0.08` (jackpot contribution rate)
   - `10` (bonus wheel trigger interval)
   - `8` (history display limit)
   These should be named constants.

9. **HTML built with string concatenation**
   `buildReel`, `addHistory`, and the message display all use `innerHTML` with concatenated strings. XSS risk if any user input ever flows into these paths, and harder to maintain than template literals or DOM methods.

10. **No input sanitization on custom funds**
    `confirmCustomFunds` uses `parseInt()` which accepts leading garbage (e.g. "100abc" → 100). The max is 10,000,000 but there's no UI feedback when the value is invalid — the button just does nothing.

11. **Empty `catch` blocks swallow errors silently**
    Multiple `try/catch` blocks with empty bodies (or just comments) around sound and speech calls. If the audio system is broken, the user gets zero feedback.

12. **`void el.offsetWidth` reflow hack**
    Used in multiple places to force CSS animation restart. Works, but is fragile and non-obvious. A utility function or `el.getAnimations()` API would be clearer.

13. **Speech and sound are tightly coupled to game logic**
    Sound and speech calls are scattered directly inside `spin()`, `celebrate()`, `addFunds()`, etc. Makes it hard to add a proper mute toggle or replace the audio system.

14. **`SYMBOLS` index used as reel position AND probability selector**
    The symbol index serves double duty. Changing symbol order in the array would break the weights mapping silently.

15. **No accessibility considerations**
    No ARIA labels, no keyboard navigation for the lever or theme swatches, no reduced-motion media query for the many animations, no screen-reader announcements for spin results.
