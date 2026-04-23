# Introduction
This lab asked us to build a significantly better slot machine than the one we produced in Lab 1, using AI as our primary engineering tool. Unlike Lab 1, which was a controlled experiment with frozen prompts and no editing allowed, this time we had full creative and technical freedom. We could prompt however we wanted, use as many turns as needed, and make real engineering decisions about architecture, design, and features.
The question we were actually exploring was not whether AI can write code. It clearly can. The real question was whether a team of students could use AI tools strategically enough to produce software that meets genuine engineering standards while also building something that is actually fun to play. We used Claude Opus 4.6 via Claude Code CLI for all development. Every iteration was logged in real time, every commit was made manually by a team member, and every AI output was reviewed before being accepted.

# Research and Planning
Before writing a single line of code, we spent time understanding what actually makes a slot machine game good. We divided research across five groups covering slot machine mechanics, casino UI/UX, competitive analysis of existing browser games, user personas, and user stories. The findings shaped every major decision we made during the build.
## What the Research Told Us
Slot machine mechanics are more sophisticated than they appear. Every spin is governed by an RNG, making each outcome statistically independent. The feel of a game is largely determined by its volatility — high volatility produces rare but exciting wins, while low volatility produces frequent smaller payouts. Modern slots go far beyond three reels and basic matching, incorporating wild symbols, scatters, multipliers, cascading reels, progressive jackpots, and bonus mini-games. A flat paytable with a few outcomes would feel shallow fast.
Casino UI/UX research reinforced that immersion is a design discipline, not an accident. The best games have a unified visual identity, animations that build anticipation by stopping reels one at a time, and sound design that scales with win size. Layout wise, the most effective designs keep balance, bet, controls, and recent results visible at all times with a paytable one tap away.
Competitive analysis of five browser slot games revealed consistent patterns. The best games had strong themes, tiered jackpot systems, autoplay and speed controls, and intentional sound design. The weakest were generic with broken buttons, sounds that persisted across tabs, and no way to track session progress. We noted specific failure modes to avoid and features worth implementing.
User personas gave us four distinct player types to design for. Mason, a college student, wants quick wins and visible progress. Jack, an experienced gambler, wants fairness, speed, and control. Steven, a casual player, cares most about visuals and zero friction. Frodo, a veteran of browser slot games, has played long enough to spot a rigged game and wants a progression system worth coming back to. Designing for all four meant prioritizing clarity, fairness, visual polish, and depth at the same time.
## How Research Shaped Our Approach
The research gave us a concrete design brief before any code was written. Rather than guessing what to build, we had evidence for every major decision. The AI token theme from Lab 1 was already distinctive and our research confirmed that a strong creative identity is what separates memorable slot games from forgettable ones. We committed to leaning into it harder this time.

# Our Approach
We structured the build as 20 iterations across 6 phases, with each team member responsible for 2 iterations. Each iteration followed the same workflow: copy the previous iteration folder, read relevant context files, prompt Claude Code with a scoped task, review the output, run ESLint, test in the browser, log the iteration, and commit manually.
The ai-plan was written before the build began and updated after Phase 1 when we realized the Lab 1 baseline already had working mechanics and animations, meaning several planned phases were redundant. We adjusted the phase goals to focus on genuine improvements rather than re-implementing what already existed.
One deliberate decision we made was to give Claude explicit permission to make independent UI and design choices if they aligned with our research. We did not want Claude to just incrementally patch the existing design. We wanted it to make real decisions grounded in what we learned.

# The Build
## Phase 1 — Code Stability (Iterations 1 to 4)
Phase 1 was entirely about the foundation. The Lab 1 final candidate was a single 2,755 line HTML file with no separation of concerns, global mutable state everywhere, and a list of bugs we discovered during a structured audit. Before any new features could be added, the codebase needed to be something a team could actually work in.
Over four iterations we split the monolith into clean HTML, CSS, and JS files, added JSDoc annotations to every function, fixed all five functional bugs including a broken near-miss detection function that turned out to be unreachable dead code, and resolved all ten code quality issues from the audit. This included consolidating state into a single STATE object, replacing string concatenation with proper DOM methods, decoupling sound and speech from game logic, and adding keyboard accessibility to the lever. By the end of Phase 1, ESLint passed clean and all 15 items from the audit were resolved.
## Phase 2 — Probability System and Slot Mechanics (Iterations 5 to 8)
[Fill in after iterations 5 to 8 are complete. Cover what mechanics were added, how the research informed the decisions, and what the phase produced as a whole.]
## Phase 3 — Animation, Feedback, and Visual Experience (Iterations 9 to 12)
[Fill in after iterations 9 to 12 are complete.]
## Phase 4 — Gameplay Features and Controls (Iterations 13 to 16)
[Fill in after iterations 13 to 16 are complete.]
## Phase 5 — Engagement and Retention (Iterations 17 to 20)
[Fill in after iterations 17 to 20 are complete.]
## Phase 6 — Final Integration and Polish
[Fill in after final polish pass is complete.]

# How AI Performed
The most consistent pattern we noticed was that Claude Code performed best when prompts were narrow and explicit. Iterations with tight scope constraints produced clean, targeted output where nothing unlisted was touched. Iterations with broader instructions sometimes produced changes that went beyond what was asked, requiring review and occasionally re-prompting.
Claude handled mechanical refactors particularly well. The STATE object consolidation in Phase 1 touched nearly every line of the file and would have been tedious and error-prone by hand. Claude read the full file and made the change consistently across every reference. It also consistently planned before coding when asked to, surfacing design questions rather than guessing, which saved revision time.
Where AI fell short was in anticipating operational consequences. Splitting the monolith into ES modules was technically correct but introduced a real regression: the game now required a local server to run rather than a simple double-click. The output was right in isolation but different in practice. This kind of subtle trade-off is something a human reviewer needs to catch, not something the model flags on its own.
[Continue filling in this section as later phases reveal more patterns. Note any hand-edits, re-prompts, or moments where Claude surprised the team in either direction.]

# The Final Product
[Fill in once the game is complete. Describe the final feature set, how it compares to the Lab 1 starting point, and include a reference to the demo video.]

# What We Took Away
[Fill in as a team after the build is complete. Keep it honest and short. A few sentences on what using AI as an engineering tool actually felt like, what it changed about how you worked, and what you would do differently.]