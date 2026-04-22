# Iteration 17 Changes

## Rewards System

Added a full rewards panel accessible via a new **Rewards** button (bottom-right, next to Settings). Players can claim bonuses across five reward categories, all of which are multiplied by their monthly streak bonus.

---

### Rewards Button (`#rewards-btn`)
- Added to the `bottom-right-btns` container alongside the Settings button.
- Displays a red animated notification badge when unclaimed rewards are available (`hasUnclaimedRewards()`).

---

### Rewards Modal (`#rewards-modal`)

A scrollable modal with five sections:

#### 1. Streak Bar
- Shows **Day Streak** (consecutive daily logins), **Month Streak** (one per 30 consecutive days), and **Reward Boost** multiplier.
- Reward Boost = `2^monthStreak` (capped at 16× for 4+ month streaks).

#### 2. Daily Login (base: 75 chips)
- Players claim once per calendar day.
- Reward is multiplied by the current Reward Boost.
- Button shows "✔ Claimed Today" once redeemed and is disabled for the rest of the day.
- `loginStreak` increments on consecutive days; breaks on any missed day (resets month streak to 0 as well).

#### 3. Daily Missions (reset each day)
Three missions tracked via spin hooks:
- **Spin 5 times today** — base reward: 30 chips
- **Win at least once today** — base reward: 40 chips
- **Place a single bet of 50+ chips** — base reward: 25 chips

Each mission shows a progress bar and a Claim button that activates when the target is reached. All rewards multiplied by Reward Boost.

#### 4. Weekend Missions (Saturday & Sunday only)
Two missions tracked during weekend sessions:
- **Spin 10 times this weekend** — base reward: 100 chips
- **Land a big win or jackpot** — base reward: 150 chips

On weekdays the section shows a locked message. On weekends, missions track spin and win progress. Resets each new ISO week. All rewards multiplied by Reward Boost.

#### 5. Weekly Reward (base: 250 chips)
- One redemption per ISO week (resets every Monday).
- Multiplied by Reward Boost.
- Shows "✔ Claimed This Week" once redeemed.

#### 6. Invite a Friend (base: 200 chips)
- Players can claim up to **3** friend referral bonuses.
- **Copy Invite Link** button generates a unique invite code and copies the link to the clipboard (or shows the code as a toast if the clipboard API is unavailable).
- **Claim Friend Bonus** button awards `FRIEND_REWARD_BASE × Reward Boost` chips per claim.

---

### Month Streak Multiplier
- Every 30 consecutive login days earns one month of streak.
- Formula: `multiplier = 2^monthStreak` (1×, 2×, 4×, 8×, 16×).
- Breaking the daily streak resets both `loginStreak` and `monthStreak` to 0.

---

### Reward Toast
- A non-blocking toast message slides up from the bottom of the screen when any reward is claimed, displaying the chip amount earned.

---

### Spin Hook
- `updateRewardProgress({ spun, won, bet, bigWin })` is called after every spin result resolves inside `spin().then()`.
- Updates daily and weekend mission progress, saves state to localStorage, and refreshes the rewards badge.

---

### Persistence
- All reward state is stored in `localStorage` under key `safariRewardsV1`.
- Daily state resets when the calendar date changes; weekly state resets when the ISO week changes.

---

### No Existing Features Changed
- RNG, payout logic, animations, autoplay, fast spin, bonus wheel, history, stats, settings, and all other game behaviour are untouched.

### Files Touched (iteration 17 only)
- `index.html` — added `#rewards-btn` to `.bottom-right-btns`, added full `#rewards-modal` with all sections.
- `script.js` — added rewards constants, `REWARDS` state object, `loadRewards`, `saveRewards`, `initLoginStreak`, `updateRewardProgress`, `hasUnclaimedRewards`, `updateRewardsBadge`, `openRewardsModal`, `closeRewardsModal`, `renderRewardsModal`, `renderMissionList`, all claim functions, `copyInviteLink`, `showRewardToast`, event listeners; added `rewards-modal` to `anyBlockingModalOpen`; added `updateRewardProgress` hook inside `spin().then()`; added `loadRewards`, `initLoginStreak`, `updateRewardsBadge` to init.
- `style.css` — added styles for `.rewards-box`, `.rewards-streak-bar`, `.rewards-section`, `.rewards-row-card`, `.rewards-claim-btn`, `.rewards-locked`, `.mission-row`, `.mission-progress-wrap`, `.mission-progress-fill`, `.mission-claim-btn`, `.rewards-invite-card`, `.rewards-copy-btn`, `.rewards-badge`, `.reward-toast`.
- `changes.md` — this file.
