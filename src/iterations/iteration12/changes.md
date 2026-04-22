# Iteration 12 Changes

- **Safari Theme Implementation**: 
  - Added a vibrant savanna sunset background utilizing CSS gradients for the sky, sun, and ground.
  - Replaced the background constellation canvas animation with a floating embers/dust motes effect to match the warm savanna aesthetic.
  - Adjusted root color variables and borders to lean into a warmer, more thematic color palette.

- **UI & Bug Fixes**:
  - **Bet Controls**: Fixed the issue where bet adjustment buttons were invisible (due to default WebKit styling) by removing the native number input spinners and adding explicit, stylized `-` and `+` buttons around the bet input.
  - **Reel Alignment**: Fixed a bug where reel symbols did not correctly align after spinning. This occurred because the script relied on a static pixel fallback for the CSS `clamp()` height. The script now dynamically measures the actual `.reel-cell` element height on screen to calculate precise offsets.