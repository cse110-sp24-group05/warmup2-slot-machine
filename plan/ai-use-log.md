# Do not select: Copy this template and paste it below for each new iteration, then replace “Iteration X” and fill in all fields.
-------

## Iteration X 

**Phase:**  
**Team Member:**  

**Date & Time:**  

**Task:**  
(what you were trying to do)

**Model Used:**  
(Claude Opus include any skills.md used)

**Prompt Used:**  
(paste exactly what you asked AI)

**AI Output Summary:**  
(briefly describe what the AI returned)

**What you Used / Changed:**  
(what you actually kept, modified, or ignored)

**Files Updated:**  
(e.g., iterations/iteration-03/index.html)

**Result:**  
(did it work? what improved? any issues?)

**Notes / Reflection:**  
(optional: what you learned, what you'd do differently, what's left for next step)



## Iteration 1

**Phase:** Phase 1 — Baseline + Fixes + Seperate Files

**Team Member:** Nikolas Malek

**Date & Time:** 2026-04-20, 12AM - 12PM PDT

**Task:**
Split the monolithic `src/token-casino.html` (2755 lines) into three clean files in `src/iterations/iteration01/`: `index.html`, `styles.css`, `script.js`. Add JSDoc annotations with type info to every function. Identify bugs and code smells without fixing them (that's iteration 2's job). Verify ESLint passes. Leave the original `token-casino.html` untouched.

**Model Used:**
Claude Opus 4.7, Claude Code

**Prompt Used:**

I'm working on Iteration 1 of a team project refactoring a slot machine game. My role is "Debugger / Stabilizer." The goal of this iteration is ONLY to:

Read the existing monolithic file at src/token-casino.html
Split it cleanly into three separate files inside src/iterations/iteration01/:

index.html (markup only, linking to the other two files)
styles.css (all styling)
script.js (all JavaScript, using ES modules / import-export)


Do NOT fix bugs or change behavior yet — just separate concerns. The split version should behave identically to the original.
Add JSDoc comments with type annotations on every function in script.js.
Create src/iterations/iteration01/bugs.md listing any bugs, code smells, or issues you noticed while reading the code. Do NOT fix them — iteration 2 handles fixes. Just list and describe them.
Make sure the code passes ESLint (the config is eslint.config.mjs at the repo root). Run eslint on the new files and fix any lint errors before finishing.

Important constraints:

Do NOT commit anything. I'll handle all git commits myself.
Do NOT modify src/token-casino.html — leave the original baseline untouched.
If you're unsure about any design decision, ask me before proceeding.

Please start by reading src/token-casino.html and plan/ai-plan.md so you have context, then lay out a plan before writing code.

**AI Output Summary:**
Before writing any code, the AI produced a structural breakdown of the source file (CSS lines 9–1311, HTML 1314–1522, JS 1523–2755) and surfaced two design decisions rather than guessing: (1) how to handle inline `onclick` handlers when moving to a module script, (2) whether to use actual ES module syntax vs just `<script type="module">`. After I answered, it produced four files (`index.html`, `styles.css`, `script.js`, `bugs.md`), replaced all inline `onclick` handlers with `addEventListener` calls, added JSDoc annotations, and ran ESLint which passed first try. Verified `src/token-casino.html` was untouched. Total work time ~10 minutes.

**What you Used / Changed:**
Kept all four output files as-is. Did not hand-edit any code. bugs.md identified 5 functional bugs and 10 code smells. This will be the roadmap for iteration 2.

**Files Updated:**
- `src/iterations/iteration01/index.html` (new)
- `src/iterations/iteration01/styles.css` (new)
- `src/iterations/iteration01/script.js` (new)
- `src/iterations/iteration01/bugs.md` (new)

**Result:**
Works, but with one caveat. The split version is functionally identical to the original when run via a local server (`python3 -m http.server 8000` at the iteration folder → `http://localhost:8000`), but **does not work when `index.html` is opened directly by double-click**. Browser console showed `Access to script ... has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, chrome-extension, data, http, https ...`. Root cause: `<script type="module">` refuses to load over `file://`. The original worked by double-click because its JS was inline in a regular `<script>` tag.

ESLint passes cleanly. Side-by-side browser testing (split at :8000, original at :8001) confirmed identical behavior.

**Notes / Reflection:**
- The AI volunteering design questions before coding was the single biggest efficiency win. Would have had to revise otherwise.
- "Cleaner code" introduced a real usability regression (needs a server). This is exactly the kind of subtle trade-off the assignment flags — AI output was technically correct but operationally different. Worth discussing in the final report.
- We should either add a `package.json` script like `"start": "python3 -m http.server 8000"` or document the server requirement in the repo README so teammates don't hit the same confusion.
- bugs.md is solid and actionable — iteration 2 has a clear priority list. Top candidates to fix first: bet-input re-clamping (#2), misleading `totalBurned` stat (#1), and jackpot persistence (#5) if there's time.
- I did NOT need to hand-edit any code in this iteration.



## Iteration 2

**Phase:** Phase 1 — Baseline + Fixes

**Team Member:** Nikolas

**Date & Time:** 2026-04-20, ~12-1:00 PM

**Task:**
Fix three targeted bugs from iteration 1's `bugs.md` (bet re-clamp, misleading `totalBurned` stat, and visual reel strip using equal weights while results used weighted symbols). Scope was deliberately narrow — no new features, no code-smell cleanup, no touching the original `token-casino.html` or iteration 1 files.

**Model Used:**
Claude Opus 4.7 via Claude Code CLI. No skill files used.

**Prompt Used:**

I'm working on Iteration 2 of a team slot machine refactor. My role is "Debugger / Stabilizer." Iteration 1 split the monolith into clean files and identified bugs in src/iterations/iteration01/bugs.md — do NOT re-read the original src/token-casino.html, work from iteration 1's code.

The iteration 2 starting point is src/iterations/iteration02/ (I've already copied iteration 1's output there). Your job: fix a specific subset of bugs from bugs.md while leaving everything else untouched.

Fix these three bugs (and nothing else)

Bug #2 — Bet input not re-clamped after balance changes.**
Scenario: player bets 50, balance drops to 5. Bet input still shows 50. Next spin fails silently with "Insufficient tokens." Fix: after every balance change (win, loss, add/remove funds), re-clamp the bet input to min(currentBet, balance). If balance is 0, disable the spin button. Show a visible message if bet was auto-adjusted.

Bug #1 — `totalBurned` misleadingly includes pair-payout losses.**
Scenario: on a pair (×0.5), `totalBurned += Math.max(0, bet - winAmt)` counts the net loss as "burned," but the player got half their bet back — it wasn't burned, it was partial loss. Fix: `totalBurned` should only increment on full losses (no payout at all). Redefine or rename if needed for clarity. Update any UI that displays this stat accordingly.

Bug #3 — Visual reel STRIP uses equal-frequency symbols while results use weighted symbols.**
Scenario: the spinning animation shows every symbol with equal frequency, but actual spin outcomes are determined by SYMBOL_WEIGHTS (rare symbols really are rare). This makes the animation look like near-misses on rare symbols are happening way more than they actually can. Fix: make the STRIP reflect SYMBOL_WEIGHTS — e.g., if a symbol's weight is 1 and another's is 10, the strip should contain them in roughly that 1:10 ratio. Keep the strip length reasonable (don't let it explode into thousands of cells).

Constraints

- ONLY edit files in src/iterations/iteration02/. Do NOT touch iteration01/ or token-casino.html.
- Do NOT add new features. Do NOT fix other bugs from bugs.md. Do NOT refactor code smells. We have other iterations for those.
- Preserve JSDoc annotations. If you add new functions, give them JSDoc too.
- Do NOT commit anything. I'll handle all git operations.
- Run ESLint on the new files before declaring done. Fix any lint errors.
- I have a local server running at http://localhost:8000 pointing at iteration02/, so I can verify as you go.
- Before writing code, briefly plan each fix and surface any ambiguity. Ask before proceeding if anything is unclear.

After you finish

Create src/iterations/iteration02/fixes.md with one section per bug, showing:
- The bug description
- What you changed (high level, not full code)
- How to reproduce the bug and verify the fix

Start by reading src/iterations/iteration01/bugs.md and src/iterations/iteration02/script.js so you have context, then lay out your plan.

**AI Output Summary:**
Claude Code read `bugs.md` and `script.js` first, then laid out a plan before coding. All three fixes implemented in a single pass:
- **Bug #3 (STRIP):** Rebuilt as a 54-cell weighted strip, shuffled once. Added a `STRIP_POSITIONS` lookup and `stripPositionFor()` helper so `spin()` passes actual strip positions to `animateReel()`. Parameter renamed to `targetStripPos` for clarity.
- **Bug #1 (totalBurned):** Removed the `else` branch inflating `totalBurned` on pair payouts. Now only `type === 'lose'` increments it.
- **Bug #2 (bet re-clamp):** Added four helpers — `reclampBet()`, `updateSpinAvailability()`, `showBetAdjustNotice()`, `clearBetAdjustNotice()`. Wired them into `spin()`, `addFunds()`, `awardWheelPrize()`, `resetGame()`, and the bet input handlers. Added a new `#bet-adjust-note` DOM element styled under the bet input to visibly inform the player when their bet was auto-adjusted.

ESLint passed. `fixes.md` produced with reproduction + verification steps per-bug.

**What you Used / Changed:**
Kept all changes as-is. No hand-editing required.

**Files Updated:**
- `src/iterations/iteration02/index.html` (bet adjust notice element added)
- `src/iterations/iteration02/styles.css` (styling for new notice)
- `src/iterations/iteration02/script.js` (three bug fixes + four new helpers + JSDoc)
- `src/iterations/iteration02/fixes.md` (new)

**Result:**
All three fixes verified in browser at http://localhost:8000.
- **Bug #2:** Confirmed bet input auto-adjusts downward when balance drops below it, with visible notice. Spin button disables at balance 0.
- **Bug #1:** Observed `totalBurned` only increments on full losses, not pair payouts.
- **Bug #3:** Reel animation now visibly shows rare symbols less often, matching the weighted result logic.

ESLint clean. No regressions noticed in side-by-side comparison with iteration 1.

**Notes / Reflection:**
- Narrow, explicit scope in the prompt worked well, Claude code stayed in its lane. Every bug I listed got fixed, nothing I didn't list got touched. the plan was understood by claude and it executed quicker.
- The fix for bug #2 was more thorough than I expected four helpers and a new DOM element rather than a one liner. That's good defensive design (every balance change path now calls reclampBet), but it's the kind of thing that could snowball if we weren't careful with scope.
- Requiring a fixes.md alongside the code was useful for forcing the AI to think about how a reviewer would verify each change which is a good habit to encode.
- Phase 1 deliverables for my half are now complete.



## Iteration 3

**Phase:** Phase 1 — Code Stability & Core Gameplay Loop

**Team Member:** Patrick

**Date & Time:** 2026-04-20

**Task:**
Fixed Bug #4 (near-miss detection unreachable) and Bug #5 (progressive jackpot not persisted on reload). Addressed Smell #7 (var → let/const), Smell #8 (magic numbers → named constants), and Smell #10 (input sanitization on custom funds).

**Model Used:** Claude Opus 4.6 via Claude Code CLI

**Prompt Used:**
I'm working on Iteration 3 of a team slot machine refactor. My role is "Baseline Builder" under Phase 1 — Code Stability & Core Gameplay Loop.

Start by reading these files for context before doing anything:
- plan/ai-plan.md
- plan/research-overview.md
- src/iterations/iteration01/bugs.md
- src/iterations/iteration02/fixes.md
- src/iterations/iteration03/script.js

The starting point is src/iterations/iteration03/ (already copied from iteration02).

Your job this iteration is to fix the two remaining functional bugs from bugs.md and address the highest-priority code smells to improve stability. Do not act on the research this iteration — read it for directional context only. Stability and clean code are the only goals here.

Fix these two bugs:

Bug #4 — Near-miss detection logic is confused.
checkNearMiss fires when type === 'lose' and two symbols match, but calcPayout already handles pairs before near-miss can fire, making it unreachable for high-value pairs. Clarify the intent: near-miss should only fire when type === 'lose' and two symbols visually match but no payout was awarded. Make the logic explicit and add a JSDoc comment explaining exactly when it fires.

Bug #5 — Progressive jackpot does not persist on page reload.
The jackpot grows each spin but resets on reload. Fix: use localStorage to persist the jackpot value. Save after every spin, load on init. Fall back to the default starting value if no saved value exists.

Address these code smells:

Smell #7 — Replace all var declarations with let and const throughout script.js. Use const for values that never reassign, let for everything else.

Smell #8 — Replace all magic numbers with named constants at the top of script.js. At minimum: cell height (96), initial jackpot (5000), starting balance (1000), jackpot contribution rate (0.08), bonus wheel trigger interval (10), history display limit (8).

Smell #10 — Add input sanitization to confirmCustomFunds. Reject non-numeric input, show a visible error message if the value is invalid, and prevent the function from silently doing nothing on bad input.

Constraints:
- ONLY edit files in src/iterations/iteration03/
- Do NOT touch any other iteration folders or token-casino.html
- Do NOT add new features or fix anything not listed above
- Preserve all existing JSDoc annotations. Add JSDoc to any new functions
- Do NOT commit anything. I handle all git operations
- Run ESLint before declaring done and fix any lint errors
- I have a local server running at http://localhost:8080 pointing at iteration03/

Before writing any code, read all files listed above and lay out your plan. Surface any ambiguities or design decisions before proceeding. Ask before acting if anything is unclear.

**AI Output Summary:**
Rewrote script.js to replace all var declarations with let/const (zero var remaining). Extracted 8 named constants to the top of the file. Redefined checkNearMiss to fire when 2+ high-value symbols appear on a losing spin (previously dead code because pairs were caught first by calcPayout). Added localStorage persistence for the progressive jackpot with load/save/clear lifecycle. Replaced parseInt with strict Number validation in confirmCustomFunds, added visible error messages in the modal UI. Added error div to index.html and matching CSS.

**What you Used / Changed:**
All AI output was used. Near-miss logic was redesigned from matching-pair detection to high-value-symbol-count detection per discussion. All other changes applied as planned.

**Files Updated:**
- src/iterations/iteration03/script.js
- src/iterations/iteration03/index.html
- src/iterations/iteration03/styles.css
- src/iterations/iteration03/changes.md

**Result:**
ESLint passes clean. All 5 fixes applied. Near-miss now fires on reachable conditions. Jackpot survives reload. Custom funds input rejects invalid values with visible feedback. No regressions in existing functionality.

**Notes / Reflection:**
The near-miss function was completely dead code in iterations 1-2 — it checked for matching pairs that calcPayout already handled. The new definition (2+ high-value symbols on a loss) is actually reachable and creates meaningful gameplay moments. Iteration 4 should consider addressing remaining code smells (#6 global state, #9 innerHTML, #11 empty catch blocks).



## Iteration 4

**Phase:** Phase 1 — Code Stability & Core Gameplay Loop

**Team Member:** Patrick

**Date & Time:** 2026-04-20

**Task:**
Address six remaining code quality issues from the iteration 1 audit (#6, #9, #11, #12, #13, #15) to improve maintainability, safety, and accessibility. No new bug fixes — all five bugs were resolved in iterations 2 and 3. This iteration closes out Phase 1 cleanly.

**Model Used:** Claude Opus 4.6 via Claude Code CLI

**Prompt Used:**
see ai-use-log.md — Iteration 4 prompt

**AI Output Summary:**
Consolidated all mutable game state into a single STATE object, eliminating scattered top-level variables. Replaced innerHTML string concatenation in buildReel and addHistory with proper DOM methods. Converted remaining string concatenation to template literals throughout. Replaced all empty catch blocks with descriptive console.warn logging. Extracted the CSS animation restart hack into a named forceReflow() utility with JSDoc. Added a SOUND_MAP and playSound() wrapper to decouple audio from game logic, and made speak() self-guarding. Added keyboard support (Enter/Space) on the lever for accessibility. Updated changes.md to document all six fixes with verification steps. Removed a stale fixes.md that was an accidental copy from iteration02.

**What you Used / Changed:**
All AI output used as-is. The changes.md was rewritten from scratch since the copied version still referenced iteration03. The stale fixes.md was deleted since this iteration contains no bug fixes.

**Files Updated:**
- src/iterations/iteration04/script.js
- src/iterations/iteration04/changes.md (rewritten)
- src/iterations/iteration04/fixes.md (deleted — not applicable this iteration)

**Result:**
All six issues resolved. Verified via grep: no bare catch blocks, no illegal innerHTML usage, no top-level state variables remaining. Template literals used throughout. Lever responds to keyboard input. ESLint passes clean. No regressions in existing functionality. All 15 items from the iteration01 audit are now fully resolved across iterations 2 through 4.

**Notes / Reflection:**
The STATE object refactor touched the most lines — every reference to balance, spinning, totalWon and similar variables changed to STATE.balance, STATE.spinning, STATE.totalWon. This is the kind of mechanical refactor that is easy to get wrong by hand but straightforward for AI. The playSound() wrapper eliminated around 15 individual try/catch blocks scattered through game logic — if a future phase needs a global mute toggle or audio system replacement, there is now exactly one place to change. Phase 2 is inheriting a clean, fully audited codebase with no known outstanding issues.

## Iteration 5 

**Phase:** Phase 2 - Core Mechanics

**Team Member:** Zay

**Date & Time:** 2026-04-20 

**Task:**  
Implement a proper RNG system using cryptographic randomness, rebalance the payout table to achieve a mathematically verified ~95% RTP (up from 33.6%), and add session RTP tracking so the math can be verified during play.

**Model Used:**  
Claude Opus 4.6 via Claude Code CLI

**Prompt Used:**  
I'm working on Iteration 5 of a team slot machine project. My role is "Logic Builder" under Phase 2 — Core Mechanics.

Start by reading these files for context before doing anything:
- plan/ai-plan.md
- plan/research-overview.md
- src/iterations/iteration04/changes.md
- src/iterations/iteration04/index.html
- src/iterations/iteration04/script.js
- src/iterations/iteration04/styles.css

The starting point is src/iterations/iteration04/ (already copied from iteration03).

Your job this iteration is to carry out iteration 5 (RNG system improvements/implement) per the Phase 2 plan in the plan/ai-plan.md file. Do NOT edit any other iteration folders or token-casino.html, and PRESERVE all existing JSDoc annotations. Do NOT add new features or fix anything not listed above.

**AI Output Summary:**  
Replaced all game-critical Math.random() calls with a secureRandom() wrapper around crypto.getRandomValues(). Rebalanced all payout multipliers (pairs from 0.5× to 2.4×, diamond jackpot from 50× to 150×, all others scaled proportionally) to achieve 95.09% theoretical RTP. Added PAYOUT_TABLE constant object so multipliers aren't magic numbers. Added STATE.totalWagered / STATE.totalReturned tracking and a live "session RTP" display in the token bar. Pre-computed TOTAL_WEIGHT to avoid recalculating on every spin. Added probability documentation in JSDoc comments. Updated HTML paytable to show new multipliers and theoretical RTP.

**What you Used / Changed:**  
All AI output used. No hand edits.

**Files Updated:**  
- src/iterations/iteration05/script.js
- src/iterations/iteration05/index.html
- src/iterations/iteration05/styles.css (unchanged from iteration 04)
- src/iterations/iteration05/changes.md

**Result:**  
Node syntax check passes clean. Theoretical RTP verified at 95.09% via probability simulation. Hit frequency unchanged at 27.77%. All game-critical randomness now uses crypto.getRandomValues. Visual-only randomness (confetti, background, particles) intentionally left on Math.random since it doesn't affect outcomes.

**Notes / Reflection:**  
The biggest finding was that the existing RTP was only 33.61% — the player was losing 66 cents of every token. The research overview specifically warned that "players can tell when a game feels broken." Pairs were the key lever: they happen ~25% of the time, so bumping them from 0.5× (a loss) to 2.4× (a profit) accounted for ~61% of total RTP. This matches real slot design where frequent small wins sustain the session while rare jackpots provide excitement.