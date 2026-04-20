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
