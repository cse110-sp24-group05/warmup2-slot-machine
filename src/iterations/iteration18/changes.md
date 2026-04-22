# Iteration 18 Changes

## Progression System

Added a full tier rank and leveling system. Players earn XP by spinning and can level up to a maximum of level 60. Difficulty increases as the player ranks up.

---

### Tier Ranks

Eight tiers that unlock at specific levels:

| Rank         | Icon | Level | Difficulty |
|--------------|------|-------|------------|
| Bronze       | 🥉   | 1     | Normal     |
| Silver       | 🥈   | 8     | 5% harder  |
| Gold         | 🥇   | 16    | 10% harder |
| Platinum     | 💠   | 23    | 15% harder |
| Diamond      | 💎   | 31    | 22% harder |
| Master       | 🔥   | 38    | 28% harder |
| Grandmaster  | ⚡   | 46    | 35% harder |
| Challenger   | 👑   | 53    | 42% harder |

Difficulty is applied by reducing the probability of rare symbols (Diamond, Lion, Jaguar, Wild, Scatter, Multiplier) at higher ranks.

---

### Leveling System

- **Max Level:** 60
- **XP Per Spin:** Base 5 + floor(bet / 10). Bonuses: +10 for wins, +25 for big wins, +50 for jackpots.
- **XP Scaling:** XP required per level = `floor(80 * level^1.35)`. Higher levels require exponentially more XP.
- **Level-Up Rewards:** 50 + level * 25 chips per level.
- **Checkpoint Rewards:**
  - Level 15: 3,000 chips
  - Level 30: 8,000 chips
  - Level 60: 50,000 chips

Checkpoints trigger enhanced celebrations (confetti, coin rain, screen flash, jackpot sound).

---

### Per-Level Missions

Each level has 3 missions that grant bonus chip rewards when completed:

1. **Spin X times** — spin count scales with level (3 at Lv.1 up to 100 at high levels)
2. **Win Y times** — win count scales with level
3. **Variable mission** — changes based on level range:
   - Levels 1–15: Place a bet of X+ chips
   - Levels 16–35: Land X big win(s)
   - Levels 36–60: Win X total chips

Mission rewards scale with level. Missions reset when leveling up.

---

### Progression Bar (`#prog-bar`)

A compact bar displayed on the main screen between the stats bar and game area, showing:
- Current rank icon and name
- Current level
- XP progress bar
- XP text (current / needed)

Clicking the bar opens the full progression modal.

---

### Progression Button (`#progression-btn`)

Added to `.bottom-left-btns` alongside History and Stats. Opens the progression modal.

---

### Progression Modal (`#progression-modal`)

A scrollable modal with sections:
- **Rank Display:** Current rank icon, name, level, and next rank info
- **XP Bar:** Visual progress toward next level
- **Level Missions:** 3 missions with progress bars and claim buttons
- **Level Up Rewards:** Preview of next level reward and upcoming checkpoints
- **Difficulty:** Shows current rank difficulty modifier
- **Tier Ranks:** Grid overview of all 8 tiers with unlock levels

---

### Difficulty Scaling

The `weightedSymbol()` function now applies a difficulty factor based on current rank. At higher ranks, rare/valuable symbols (marked `rare: true`) have reduced probability weights, making wins harder to achieve.

---

### Persistence

All progression state is stored in `localStorage` under key `safariProgressionV1`.

---

### No Existing Features Changed

- RNG base system, payout logic, animations, autoplay, fast spin, bonus wheel, rewards, history, stats, settings, and all other game behaviour remain untouched.
- The only modification to existing code is `weightedSymbol()` (applies rank-based difficulty factor) and `anyBlockingModalOpen()` (includes progression modal). A single hook `updateProgressionAfterSpin()` was added inside `spin().then()`.

### Files Touched (iteration 18 only)

- `index.html` — added `#prog-bar` (progression bar), `#progression-btn` to `.bottom-left-btns`, added full `#progression-modal` with all sections.
- `script.js` — added progression constants (`TIER_RANKS`, `PROGRESSION` state), `getCurrentRank`, `getNextRank`, `getDifficultyFactor`, `xpForLevel`, `getLevelReward`, `isCheckpointLevel`, `getMissionsForLevel`, `loadProgression`, `saveProgression`, `awardXP`, `onLevelUp`, `updateProgressionAfterSpin`, `claimLevelMission`, `updateProgressionUI`, `renderProgressionModal`, `openProgressionModal`, `closeProgressionModal`, event listeners; modified `weightedSymbol` to apply difficulty factor; added `'progression-modal'` to `anyBlockingModalOpen`; added `updateProgressionAfterSpin` hook inside `spin().then()`; added `loadProgression`, `updateProgressionUI` to init.
- `style.css` — added styles for `.prog-bar`, `.prog-bar-rank`, `.prog-bar-level`, `.prog-bar-xp-wrap`, `.prog-bar-xp-fill`, `.prog-bar-xp-text`, `.progression-box`, `.prog-rank-display`, `.prog-rank-icon`, `.prog-rank-name`, `.prog-rank-level-label`, `.prog-rank-next`, `.prog-xp-section`, `.prog-xp-bar-modal`, `.prog-xp-fill-modal`, `.prog-missions-section`, `.prog-section-title`, `.prog-reward-item`, `.prog-reward-checkpoint`, `.prog-reward-max`, `.prog-reward-amount`, `.prog-difficulty-info`, `.prog-diff-label`, `.prog-diff-value`, `.prog-tiers-grid`, `.prog-tier-item`.
- `changes.md` — this file.
