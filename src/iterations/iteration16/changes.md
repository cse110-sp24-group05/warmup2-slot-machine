# Iteration 16 Changes

- **Settings Button**:
  - Added a **Settings** button (`#settings-btn`) fixed to the **bottom-right corner** of the screen.
  - Uses the same `.bottom-panel-btn` style as the existing History and Stats buttons for visual consistency.

- **Settings Modal**:
  - Clicking the Settings button opens a modal (`#settings-modal`) with toggle-style checkboxes grouped into two sections: **Sound** and **Controls**.

- **Sound Effects Toggle**:
  - Checkbox (`#setting-sfx`) to enable or disable all game sound effects (spin, win, loss, lever, coin, wheel, etc.).
  - When unchecked, the `playSound()` function returns early without producing any audio.
  - Enabled by default (`STATE.soundEnabled = true`).

- **Voiceover Toggle**:
  - Checkbox (`#setting-voice`) to enable or disable spoken commentary during gameplay.
  - Syncs bidirectionally with the existing Voice toggle button in the header — changing one updates the other.
  - Enabled by default (`STATE.speechEnabled = true`).

- **Keyboard Controls Toggle**:
  - Checkbox (`#setting-keyboard`) to enable or disable keyboard shortcuts for spinning.
  - When enabled, pressing **Space** or **Enter** triggers a spin (only when no input/button is focused and no modal is open).
  - Disabled by default (`STATE.keyboardEnabled = false`).

- **Implementation Details**:
  - Added `STATE.soundEnabled` and `STATE.keyboardEnabled` to the game state object.
  - Added a `syncSpeechUI()` helper so the header Voice button and the settings checkbox stay in sync.
  - Added `settings-modal` to the `anyBlockingModalOpen()` check so autoplay pauses while the settings panel is open.
  - Keyboard listener ignores events when the active element is an `INPUT`, `TEXTAREA`, or `BUTTON` to avoid conflicts with typing.

- **No existing features changed** — the RNG, payout logic, animations, autoplay, fast spin, bonus wheel, history, stats, and all other game behaviour are untouched.

- **Files touched (iteration 16 only)**:
  - `index.html` — added `.bottom-right-btns` container with `#settings-btn`, added `#settings-modal` with three checkbox toggles.
  - `script.js` — added `STATE.soundEnabled` + `STATE.keyboardEnabled`, added `playSound()` guard, added `syncSpeechUI()`, added `openSettingsModal` / `closeSettingsModal` plus checkbox handlers, added keyboard listener, updated `anyBlockingModalOpen`.
  - `style.css` — added styles for `.bottom-right-btns`, `.settings-box`, `.settings-section`, `.settings-section-label`, `.settings-divider`, `.settings-toggle`, custom checkbox appearance, `.settings-toggle-label`, `.settings-toggle-desc`.
  - `changes.md` — this file.
