# Iteration 14 Changes

- **Fast Spin Button + Speed Picker**:
  - Added a new **⚡ Fast Spin** button sitting **to the left of the Spin button** inside the main control row (full order now: Fast Spin · Spin · Autoplay · Refill · Paytable).
  - Clicking Fast Spin opens a new modal (`#fast-spin-modal`) with three options:
    - **Normal 1×** — default pacing.
    - **Fast 2×** — roughly halves the animation time.
    - **Turbo 3×** — roughly a third of the animation time.
  - The Fast Spin button shows the current speed in its label (`Fast Spin` → `Fast 2×` / `Fast 3×`) and gains an `.active` gold-gradient fill whenever a non-default speed is selected, so the player can see their current choice at a glance without opening the modal again.
  - Speed changes only affect animation pacing — the RNG, payout logic, autoplay, free spins, and every other game behaviour are untouched. Picking a faster speed just means results arrive sooner.
  - Implementation details in `script.js`:
    - Added `STATE.spinSpeed` (default `1`), a `SPIN_SPEEDS = [1, 2, 3]` whitelist, and a `getSpinSpeed()` accessor.
    - Rewrote `animateReel()` so every timing it owns is divided by the current speed: the reel-start stagger (`delay / speed`), the per-frame interval (`40 / speed` ms, clamped ≥8 ms), the final settle CSS transition (`0.28s / speed`), and the settle wait before resolving (`300 / speed` ms, clamped ≥60 ms).
    - Added `setSpinSpeed`, `updateFastSpinUI`, `openFastSpinModal`, `closeFastSpinModal`, plus event bindings for the Fast Spin button, the three preset buttons, Cancel, and overlay click-to-close.
    - `updateFastSpinUI()` runs on init so the button label stays consistent with `STATE.spinSpeed`.

- **Spin / Refill / Paytable — locked colours (yellow, pink, gold)**:
  - The three primary buttons are now painted with fixed colours that never change regardless of the cursor state:
    - **Spin** → solid **yellow** `#ffd600` with dark text and a warm yellow glow.
    - **Refill** → solid **pink** `#ff69b4` with dark text and a pink glow.
    - **Paytable** → solid **gold** `#d4af37` with dark text and a gold glow.
  - Each button's `:hover`, `:focus`, and `:focus-visible` selectors are bundled with the base selector and given **identical** `background`, `color`, `border`, `box-shadow`, and `transform: none` values. This means the fill, border, and text colour stay exactly the same whether the cursor is on the button or not — no colour flip, no lift, no brightness change.
  - This satisfies the "always appear yellow / pink / gold regardless of where the cursor is" requirement while still leaving the `:disabled` state (global 35% opacity) in place so the buttons visually indicate when they can't be used.

- **Files touched (iteration 14 only)**:
  - `index.html` — added the `#fast-spin-btn` to the left of `#spin-btn` in `.btn-row`, and added the `#fast-spin-modal` block alongside the other modals.
  - `script.js` — added `STATE.spinSpeed` + `getSpinSpeed()`, rewrote `animateReel()` to honour the speed multiplier, added the fast-spin modal helpers and event bindings, and called `updateFastSpinUI()` during init.
  - `style.css` — replaced the old hover-changing rules for `#spin-btn`, `#reset-btn`, `.paytable-btn` with rules that lock the colours across rest/hover/focus, and added rules for `.fast-spin-btn`, `.fast-spin-btn.active`, `.fast-spin-note`, `.fast-spin-presets`, `.fast-spin-preset`, and `.fast-spin-preset.active`.
  - `changes.md` — this file.
