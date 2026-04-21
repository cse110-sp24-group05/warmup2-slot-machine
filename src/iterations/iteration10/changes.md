# Slot Size & Lever Motion Updates

Both changes are in place. Here's a summary of what was done:

---

## Slot Size & Proportion

- `--cell` changed from fixed `80px` to:  
  `clamp(80px, calc((100vh - 460px) / 3), 130px)`  
  → Cells now scale with viewport height (typically **95–130px** on a normal desktop)

- `.reel-wrap`:
  - Changed from fixed `width: 96px` → `flex: 1`
  - Allows the three reels to expand and fill available horizontal space

- `.reel-cell`:
  - Uses `width: 100%` to fully match its container

- `.reels`:
  - Set to `flex: 1`
  - Ensures it fills the full width allocated by the parent

- Symbol (emoji) font size:
  - `clamp(30px, calc(var(--cell) * 0.40), 54px)`
  - Scales proportionally with cell size

- JavaScript update:
  - `CELL_HEIGHT` is now read from the computed CSS variable at startup
  - Keeps animation math synchronized with responsive sizing

---

## Lever Motion

- Removed horizontal rotation:
  - `rotate(-30deg) → rotate(30deg)`

- Lever arm behavior:
  - Starts at the top of the groove (`top: 6px`)
  - Slides down **74px** when pulled
  - Uses `leverPullDown` keyframe with `0.14s ease-in`

- Release animation:
  - Uses `leverSnapUp` keyframe with bounce:
    - Overshoot: `-12px`
    - Settle sequence: `+5px → -2px → 0`
    - Duration: `0.44s` with spring-like easing

- Structural changes:
  - Shaft shortened: `88px → 48px`
    - Prevents clipping and allows full travel

  - Base plate:
    - `z-index: 3`
    - Ensures it sits on top as a clean socket

  - `.lever-wrap`:
    - Added `overflow: hidden`
    - Keeps the lever motion clipped within the card