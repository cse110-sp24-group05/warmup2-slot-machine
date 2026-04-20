# Research Overview


## What We Were Trying to Figure Out

Before writing a single line of code, we wanted to understand what actually makes a slot machine game good. Not just functional, but genuinely fun and worth playing. We looked at this from three angles: how real slot machines work under the hood, what the best browser-based slot games do well, and who is actually going to be playing our game and what they care about.

---

## How Slot Machines Actually Work

The core of every slot machine is a Random Number Generator (RNG). Every spin is completely independent, meaning previous results have zero effect on what comes next. This matters because a lot of players believe in streaks or patterns, but mathematically they do not exist.

The math model behind a slot machine is defined by a few key concepts. Volatility determines the risk level of the game. High volatility means wins are rare but big, while low volatility means smaller but more frequent payouts. RTP (Return to Player) is the average percentage of money returned to players over a long period, typically sitting around 95% in real casinos. Hit frequency is another useful metric, representing how often any given spin results in a win at all.

Modern slot machines have expanded far beyond the classic three reel setup. Common features now include free spins triggered by scatter symbols, multipliers that stack on top of wins, cascading reels where winning symbols disappear and new ones fall in, progressive jackpots that grow as players bet, and bonus buy features that let players skip straight to a minigame. Win conditions have also evolved from simple paylines to ways-to-win systems where any matching symbols on adjacent reels count as a win regardless of exact position.

For our build, the takeaway is that win conditions need to feel varied and the payout logic needs to be mathematically consistent. Players can tell when a game feels broken even if they cannot explain exactly why.

---

## What Makes Casino Games Feel Good

The best casino games are not just functional, they are immersive. Visual design, sound, and animation all work together to make each spin feel significant.

On the visual side, strong games have a clear identity tied to a theme. Colors, symbols, and animations all reinforce the same world. Win celebrations scale with win size, so a small win gets a subtle effect while a jackpot triggers a full screen moment. Reel animations matter a lot too. Reels that stop one at a time with a slight delay build anticipation in a way that instant results never do. Symbols should blur during fast spinning and sharpen as the reel slows, with a slight overshoot and bounce on landing.

Sound design follows the same layered logic. Background music sets the mood. Each reel has its own click when it stops. Win sounds scale with the size of the win, with bigger wins triggering longer and more exciting audio. Losses get a subtle descending tone that acknowledges the result without being irritating. Jackpots get something entirely unique.

Layout wise, the most effective designs use a two panel structure. A jackpot display sits at the top showing progressive values climbing in real time. The main game area below contains the reels, balance, bet amount, and controls. A transaction log gives players a way to review their session. Autoplay and speed controls are effectively expected features at this point.

---

## What We Learned from Existing Games

We played five browser based slot machine games and took notes on what worked and what did not. A few clear patterns emerged.

The best games had strong visual themes that carried through every element of the interface. They had tiered jackpot systems where higher bets unlocked bigger potential wins. They had autoplay and speed controls so players could move at their own pace. They had clear paytables that were easy to find and understand. And they had sound design that felt intentional rather than tacked on.

The worst games felt generic. No identity, no theme, nothing memorable. Common failure points included non-functional buttons, sounds that kept playing after switching tabs, no way to track cumulative winnings across a session, and interfaces that looked outdated. Several games also had autoplay that was clunky or hard to stop once started.

One pattern worth highlighting is that the games people remember are the ones built around a strong creative concept. Generic fruit symbols and a basic paytable are forgettable. A game with a distinctive theme, a sense of humor, and mechanics that reinforce that identity sticks with you.

---

## Who Is Playing This

Our user research pointed to a few distinct types of players we need to design for.

Casual players want the experience to feel exciting without being complicated. They care about fanfare when they win, a theme that is visually interesting, and controls that are obvious without any explanation needed. They are likely to quit if the interface is confusing or if losing feels punishing with no sense of progress.

Hardcore players want depth. They want bet customization, variety in win conditions, and some kind of progression system that rewards time spent even during losing streaks. They notice when the math feels off and they appreciate transparency around how the game works.

Both types of players share some common needs. A mute button should always be visible. Bet controls should be easy to adjust. The balance and recent results should always be on screen. And the game should never leave a player stuck with no path forward.

---

## What This Means for Our Build

Pulling everything together, a few priorities are clear going into the build phase.

The AI token theme from Lab 1 is a strong creative foundation and we should lean into it harder this time. The humor and sarcasm that made the best Lab 1 candidates memorable is exactly the kind of identity that makes a slot game stick.

Win conditions need variety. A flat paytable with three or four outcomes gets boring fast. We should have tiered wins, a progressive jackpot, a bonus mechanic, and near miss behavior that feels deliberate rather than accidental.

Sound and animation need to scale with outcome size. A small win and a jackpot should feel completely different from each other. The reel stop animation, the sound design, and the visual feedback should all reinforce that difference.

The interface needs to be clean and readable at a glance. Balance, bet, recent results, and controls should always be visible. The paytable should be one tap away. Autoplay and speed controls are expected by anyone who has played a slot game before.

And finally, the code needs to be engineered properly this time. Modular, documented, tested, and consistent. The goal is a codebase that reads like one person wrote it, not a team of people prompting an AI in parallel.
