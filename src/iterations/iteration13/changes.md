# Iteration 13 Changes

- **Autoplay Feature**:
  - Added a new **Autoplay** button to the main control row (between the Spin and Refill buttons).
  - Clicking the button opens an Autoplay modal where the player chooses how many spins to run: preset options (5, 10, 25, 50, 100, 250) plus a custom input (1–10,000 spins).
  - Once started, the game automatically spins the reels on a timed loop at the currently selected bet amount. A short gap (~0.9s) between spins gives the player time to read each outcome.
  - Autoplay stops automatically when:
    - the chosen number of spins has been completed,
    - the balance runs out of chips,
    - the next bet would exceed the remaining balance,
    - the player clicks the Autoplay button again (now labeled **⏹ Stop**) to cancel early,
    - the player clicks **Refill**.
  - While autoplay is running, the button flips to a red pulsing **⏹ Stop** state with a badge showing the remaining spin count (e.g. `12 left`), counting down after every spin.
  - The autoplay loop yields to any open modal (bonus wheel, add-funds, paytable), resuming once it closes so the player is never locked out of those interactions.
  - New state (`AUTOPLAY`) and helpers (`startAutoplay`, `stopAutoplay`, `runAutoplayNext`, `updateAutoplayUI`, modal open/close/confirm, preset handler) were added in `script.js`. The existing `spin()` logic is untouched — autoplay just drives it on a loop.

- **Button Visibility Fix**:
  - The **Spin**, **Refill**, and **Paytable** buttons previously used low-contrast backgrounds (`var(--surface2)` with muted or faint-gold text) that blended into the dark savanna backdrop and were nearly invisible unless hovered.
  - Each button now has a clearly contrasting default fill with light/high-contrast text:
    - **Spin** → vivid gold gradient (`#d4af37 → #ffd700 → #b8860b`) with a cream-tinted border.
    - **Refill** → crimson gradient (`#7d2a2a → #9b1b30`) with cream text.
    - **Paytable** → bronze gradient (`#4a3010 → #7a5020`) with cream text.
  - Hover styles were also refreshed to be visibly different from the resting state (brighter/lighter gradients, stronger glow, subtle lift), so hover feedback remains obvious without being the only way to see the buttons.
  - The new Autoplay button follows the same pattern — a green gradient at rest, brighter green on hover, and a distinct pulsing red gradient while autoplay is running.
