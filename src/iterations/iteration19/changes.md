# Iteration 19 Changes

## Theme Personalization System

Added a visual theme personalization system that lets players switch between three cohesive UI themes without affecting gameplay, payouts, progression, or any game mechanics.

---

### Themes Button

Added a `Themes` button (`#themes-btn`) to `.bottom-right-btns` between the Rewards and Settings buttons. Opens the themes modal.

---

### Themes Modal (`#themes-modal`)

A modal with three selectable theme cards, each with a color swatch preview, name, and description. Clicking a card instantly applies the theme. The active theme shows a checkmark indicator.

---

### Three Themes

| Theme | Class | Description |
|-------|-------|-------------|
| Safari Gold | (default, no class) | The original gold/brown savanna design |
| Jungle Emerald | `body.theme-jungle` | Deep forest greens, emerald accents, teal glows |
| Midnight Neon | `body.theme-neon` | Dark navy with neon purple/cyan/magenta accents |

Each theme overrides the following CSS custom properties and visual elements:
- `--bg`, `--surface`, `--surface2` (background/panel colors)
- `--border`, `--border2` (border colors)
- `--text`, `--muted` (text colors)
- `--accent`, `--accent2` (primary/secondary accent)
- `--jackpot`, `--bigwin`, `--pair` (outcome colors)
- `--win`, `--lose` (win/loss colors, neon theme only)
- Body background gradient
- Title gradient text
- Machine frame border gradient and glow states
- Reel divider lines and vignette
- Lever knob, shaft, groove, and base plate
- Jackpot tier panels (grand, major, mini)
- Jackpot amount pulse animation
- Progression bar XP fill and modal XP fill
- Mission progress fill bars
- Spin, Paytable, Reset, Fast Spin, and Autoplay button colors
- Modal background, title gradient, and confirm button
- Bonus wheel spin button and pointer
- Bottom panel buttons (History, Stats, Rank, Rewards, Themes, Settings)
- Speech toggle active state
- Custom funds button accent
- Winner/wild/scatter/multiplier reel highlights (neon)
- Reward toast background
- Theme card active state indicator

---

### Persistence

Theme choice is saved to `localStorage` under key `safariThemeV1` and restored on page load.

---

### No Existing Features Changed

- RNG, payout logic, symbol definitions, hit frequency, progression, rewards, missions, autoplay, fast spin, bonus wheel, history, stats, settings, and all other game behavior remain completely untouched.
- The only modifications to existing code:
  - `anyBlockingModalOpen()` — added `'themes-modal'` to the blocking modal list.
  - Init section — added `applyTheme(loadTheme())` call before existing init.

### Files Touched (iteration 19 only)

- `index.html` — added `#themes-btn` to `.bottom-right-btns`, added full `#themes-modal` with three theme cards.
- `script.js` — added theme constants (`THEME_STORAGE_KEY`, `VALID_THEMES`), `loadTheme`, `applyTheme`, `updateThemeCards`, `openThemesModal`, `closeThemesModal`, event listeners for theme button/modal/cards; added `'themes-modal'` to `anyBlockingModalOpen`; added `applyTheme(loadTheme())` to init.
- `style.css` — added styles for `.themes-box`, `.themes-note`, `.themes-grid`, `.theme-card`, `.theme-check`, `.theme-swatch`, `.theme-card-name`, `.theme-card-desc`; added full `body.theme-jungle` override block; added full `body.theme-neon` override block.
- `changes.md` — this file.
