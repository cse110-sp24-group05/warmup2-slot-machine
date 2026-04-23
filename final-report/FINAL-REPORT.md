# Introduction

This lab was set up for us to use AI code generation on purpose. The assignment expected Claude Code (or similar) to do most of the typing while we focused on planning, prompting, testing, and logging what actually happened. We started from our Lab 1 slot machine and were asked to make something noticeably better, with way more freedom than Lab 1 had. We could iterate, change direction, and own the product decisions ourselves.

The interesting part for us was never “can AI write code?” It obviously can. The interesting part was whether a student team could steer it well enough to end up with something that still feels like a real project: organized, playable, and fun, not just a pile of generated files. We mostly used Claude Opus 4.6 in Claude Code; a few iterations in our log used 4.7 instead. We logged every iteration, committed ourselves, and tried to actually read what the model produced before we kept it.

# Research and Planning

Before we prompted anything serious, smaller groups in the class researched how slots work, what casino-style games look and sound like, what browser games we liked or hated, and who we imagined playing our game. We folded that into `plan/research-overview.md` and used it when writing prompts.

## What the Research Told Us

Real slot games lean on randomness. Each spin is its own roll, not a pattern you can predict. Games feel different depending on whether wins are rare and huge or smaller and more frequent. Casino-style games that feel good usually have a clear theme, motion and sound that react to wins, and a layout where your balance, bet, and controls are easy to find. The better browser games we tried had strong themes, jackpots, autoplay, speed options, and sound that felt intentional. The weaker ones felt generic or had broken UI.

We also thought about casual players versus people who want more depth. Both care about fairness, not getting stuck with no way to play, and being able to turn sound off or down. That fed into what we asked for in later phases.

## How Research Shaped Our Approach

The research gave us a shared idea of what “good” looked like before we argued in chat about features. Lab 1 already had a memorable AI token vibe; our notes said a strong identity beats a generic fruit machine. Later in the build we moved toward a safari casino look, but the early phases were mostly about fixing the base game and making the math and rules feel less broken.

# Our Approach

We followed `plan/ai-plan.md`: twenty iterations in six phases, two iterations per person, each building on a copy of the last folder. The routine was pretty repetitive: copy the iteration, point Claude at the plan and research and the right files, give it a focused task, run checks when we remembered to, click around in the browser, write the log entry, then commit. That rhythm was basically the course design: AI does the bulk of implementation, humans do scope, review, and integration.

We also told Claude it could make reasonable UI and design calls if they fit the research, so we were not micromanaging every color choice in every prompt.

# The Build

## Phase 1 - Code Stability (Iterations 1 to 4)

Lab 1’s “final” game lived in one giant HTML file thousands of lines long. Phase 1 was about splitting that into normal HTML, CSS, and JS, documenting functions, and working through the bug list and cleanup items from our first pass over the code. By the end, the log describes a cleaner codebase and ESLint passing, with all the audit items from iteration 1 addressed across iterations 2 through 4.

One lesson showed up early: after the split, opening the page by double-clicking sometimes broke because of how the browser loads separate script files. Later iterations adjusted that, but it was a good reminder that “correct” code can still behave differently depending on how you open the project.

## Phase 2 - Probability System and Slot Mechanics (Iterations 5 to 8)

Here we tried to make the game feel more like an actual slot. The log says payouts were way too harsh at first and got rebalanced toward something closer to what research suggested for real machines. We added stronger randomness for outcomes, special symbols (wild, scatter, multiplier) and free spins, then moved to a three-row board with multiple paylines and line-by-line wins.

This phase also had a rough patch where the page stopped responding to clicks until we tracked down what went wrong, including some of the same “open locally vs use a small server” issues from earlier. We also fixed bet rounding so small amounts were not quietly eating player money line by line. When Phase 2 ended, the log describes the mechanics working again when opening the file directly and the odds work double-checked.

## Phase 3 - Animation, Feedback, and Visual Experience (Iterations 9 to 12)

This is where we chased a polished safari casino look: layout, gold styling, animal symbols, jackpots on screen, paytable in a modal, lever motion that felt more physical, and more sound on buttons and modals. The team liked the direction overall.

The log is also honest that CSS and layout passes did not always land. Buttons under the reels sometimes disappeared or only showed on hover, and a few fixes did not stick. So Phase 3 improved the vibe a lot but also started a UI bug that kept haunting us.

## Phase 4 - Gameplay Features and Controls (Iterations 13 to 16)

We added autoplay, faster spins, spin history (up to 100 past spins), session stats, and a settings panel for sound and keyboard controls. Those features mostly worked the way we wanted in the log.

The invisible-button problem from Phase 3 was still there. Sometimes it got a little better, sometimes worse. So Phase 4 added real slot-style convenience, but the polish was not all there yet.

## Phase 5 - Engagement and Retention (Iterations 17 to 20)

We stacked on retention attributes: daily and weekly rewards, streak bonuses, progression with ranks and levels and big rewards at certain level milestones, three visual themes you can switch between, then social-flavored features like leaderboards, a simple arena mode with simulated opponents, sending chips, invite links, and extra missions.

The log calls out gaps as well, for example, invite rewards could be claimed without a real invite, and one iteration briefly referenced functions that did not exist until someone caught it. Still, by iteration 20 the log describes those systems largely working, with clipboard fallbacks for sharing.

## Phase 6 - Final Integration and Polish

Iteration 21 was our cleanup pass. We ran a final audit on the full codebase, fixed a handful of bugs that had slipped through in the later phases, cleaned up some code that had drifted from the standards we set in Phase 1, and tested everything together before the final commit.

# How AI Performed

Claude Code was best when we gave it a tight job: fix these bugs, add this one feature, do not touch the rest. Wide-open prompts were more likely to sprawl or miss what we cared about.

It was great at big, boring edits that touch tons of lines, at sketching a plan before coding when we asked, and at math-heavy slot tweaks where we could sanity-check the result. It struggled more with “make it look right” CSS and with second-order stuff like whether the game still runs when you open it as a plain file. Several log entries say tools said everything was fine while a human could see broken or invisible controls.

We saw nice surprises, like extra polish on history entries, and bad surprises, like quiet failures until someone opened developer tools. Nothing in our process replaced actually playing the build after each iteration.

# The Final Product

By the end of iteration 21, the game is a browser slot machine with a safari theme and two alternate themes, three reels and three rows, multiple paylines, wilds and scatters and multipliers, tiered jackpots displayed in real time, autoplay and fast spin, spin history and session stats, a settings panel for sound and keyboard controls, daily and weekly rewards, a progression system with ranks and levels, leaderboards, a simple arena mode with simulated opponents, and chip sharing with invite links. Most of that state persists between visits using localStorage. Compared to the Lab 1 starting point, which was a single monolithic HTML file with basic spin logic and an AI token joke, this is a dramatically more complete and playable game.

It is not perfect. The log is honest about UI visibility issues that came and went across phases, and a few social features like referral rewards were more proof of concept than fully locked down. But the core game is solid, the odds are fair, and the features we set out to build from the research are all there in some form.

# What We Took Away

This lab was built around AI generation and that matched how it felt day to day. Fast progress when prompts were tight and specific, weird gaps and regressions when they were not. AI saved us a lot of time on big mechanical refactors, feature implementation, and slot math. It did not save us from playtesting, from chasing bugs that only show up when a real person clicks around, or from reviewing output before accepting it.

If we did this again we would probably do one dedicated pass early on to make sure every button is visible on a fresh open, rather than hoping the next iteration fixes it. We would also keep the logging habit regardless. Writing down what broke and what we actually did made this report possible and kept the whole team more honest about what was working and what was not.
