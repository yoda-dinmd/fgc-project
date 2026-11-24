## Overview
A cozy pixel RPG in the Undertale tradition: a black, white-bordered dialogue box with a typewriter effect and a question menu, used in a small top-down town. All art is drawn in code at 384×240 and scaled with `image-rendering: pixelated`.

## Colors
Page tokens live in `style.css :root` (`--bg`, `--panel`, `--ink`, `--muted`, `--line`, `--accent`, `--good`). Per-area scenery palettes live in `sprites.js PALETTES`. The game is intentionally dark-only.

## Typography
VT323 everywhere (Google Fonts), falling back to the system monospace font.

## Layout
- A game frame with a HUD bar on top (area name, thoughts count, journal button).
- The dialogue box overlays the bottom of the screen, or the top when the player stands in the lower half.
- Touch controls appear under the frame on coarse pointers.
- The results page is a full-screen scrollable overlay.

## Result model
16 worldviews. Each answer gives 2 points to one worldview and 1 to another. Affinity = earned / (offered in the answered questions + 2). Scores are hidden until the end, and then fully explained, including the per-answer breakdown. It is never presented as diagnostic.

## Do's and Don'ts
- Characters represent worldviews playfully; no character is a villain.
- Every worldview gets a sympathetic voice and appears as the main answer in at least 6 options (enforced by a test).
- Keep all content in `data.js`.
