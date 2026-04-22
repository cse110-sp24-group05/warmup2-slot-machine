# AI Usage Plan — Slot Machine Project

## Overview

Our team will use AI to iteratively build and improve a slot machine through **20 iterations across 6 phases**. Each team member completes **2 iterations**, including prompting AI, updating code, and logging work. Each iteration builds on the previous one.

We primarily use **Claude Opus 4.6** for development. If other models are used, they will be clearly documented in the AI Use Log.

---

## Phase Plan

### Phase 1 — Code Stability & Core Gameplay Loop (Iterations 1–4) ✓

**Goal:** Make the game fully functional, clean, and bug-free

**Responsibilities:**

- Split the final Lab 1 candidate into separate HTML, CSS, and JS files
- Fix bugs (spin logic, payouts, crashes) and ensure code follows clean code principles
- Audit the codebase for weaknesses and edge cases
- Ensure reels spin and update correctly
- Add basic systems (bet, balance, reset)

**Team Members:**

- Nikolas — Iterations 1, 2
- Patrick — Iterations 3, 4

---

### Phase 2 — Probability System & Slot Mechanics (Iterations 5–8)

**Goal:** Make the game behave like a real slot machine

**Responsibilities:**

- Read `plan/research-overview.md` and `plan/raw-research/` before prompting — use the research to inform every decision
- Implement and verify RNG (random spins)
- Add symbol types (wild, scatter, multiplier)
- Implement win conditions (paylines or matching system)
- Balance payouts and win frequency

**Team Members:**

- Zay — Iterations 5, 6
- Pranav — Iterations 7, 8

---

### Phase 3 — Animation, Feedback & Visual Experience (Iterations 9–12)

**Goal:** Make the game feel engaging and polished

**Responsibilities:**

- Read `plan/research-overview.md` before prompting
- Add reel animations (spin timing, stopping effects)
- Add visual feedback (win highlights, effects)
- Improve sound design (spin, win, jackpot)
- Improve UI layout and theme consistency

**Team Members:**

- Jared Rosas — Iterations 9, 10
- Nick Mitroff — Iterations 11, 12

---

### Phase 4 — Gameplay Features & Controls (Iterations 13–16)

**Goal:** Add modern slot machine features

**Responsibilities:**

- Read `plan/research-overview.md` before prompting
- Add autoplay system
- Add fast spin / speed control
- Add history or stats tracking
- Add settings panel (sound toggle, controls)
- Fix bugs

**Team Members:**

- Hanwen Chen — Iterations 13, 14
- Jaylen Cun — Iterations 15, 16

---

### Phase 5 — Engagement & Retention (Iterations 17–20)

**Goal:** Make users want to keep playing

**Responsibilities:**

- Read `plan/research-overview.md` before prompting
- Add rewards (daily bonus, streaks)
- Add progression (levels, milestones)
- Add personalization (themes, UI options)
- Add engagement features (leaderboard, sharing)

**Team Members:**

- Lisa Tran — Iterations 17, 18
- Jayden Xie — Iterations 19, 20

---

### Phase 6 — Final Integration & Polish

**Goal:** Finalize, clean, and unify the entire system

**Responsibilities:**

- Fix remaining bugs
- Improve UI/UX consistency
- Ensure all features work together
- Clean and refactor code

**Team Members (Leads):**

- Name
- Name

---

## Workflow Per Iteration

- Start from the previous iteration folder
- Read relevant files as specified in the prompt before touching code
- Prompt Claude Code with a clear, scoped task
- Review and adjust AI output before accepting
- Run ESLint and fix any issues before committing
- Test in browser via local server
- Log the iteration in `ai-use-log.md`
- Commit yourself — do not let Claude commit

---

## Guidelines

- Each iteration must update code and produce a log entry
- Do not overwrite previous iteration folders
- AI output must be reviewed and adjusted — never accepted blindly
- Hand-editing is a last resort — re-prompt first, and log it if you do hand-edit
- Any model other than Claude Opus 4.6 must be documented in the log
- Changes must align with the current phase goals
- Claude is encouraged to make independent UI, UX, and design decisions if they align with research findings and improve the player experience — following proven slot machine conventions is preferred over preserving the current design when the two conflict
