---
version: alpha
colors:
  background: '#141e28'
  panel: '#1c2a35'
  text: '#f2edda'
  muted: '#b1bdc3'
  border: '#425460'
  accent: '#edc477'
  complete: '#91c3ac'
typography:
  display:
    fontFamily: 'Georgia, serif'
  body:
    fontFamily: 'Verdana, sans-serif'
  utility:
    fontFamily: 'monospace'
rounded:
  DEFAULT: '0px'
spacing:
  base: '12px'
---
## Overview
English, Russian, and Romanian classroom exploration game. The signature is a miniature dusk town with a central unlit beacon. Restrained storybook headings frame a code-drawn pixel map. No external assets or network dependencies.
## Colors
Frontmatter roles map to style.css :root variables bg, panel, ink, muted, line, gold, mint respectively. CSS is the runtime owner. Additional canvas colours are scenery, not UI semantic tokens.
## Typography
Georgia for story titles, Verdana for readable dialogue, monospace for place names and controls. System fonts prevent offline failure and layout shifts.
## Layout
Wide map with four character buttons below. Two-column character controls on phones. Dialog content scrolls within 90dvh. Natural page scroll.
## Elevation & Depth
Native dialog backdrop separates conversations from exploration. Flat, square borders elsewhere.
## Shapes
Square pixel geometry and rectangular controls.
## Components
Native Select/Listbox: OS-owned popup is intentional for the language chooser; no custom popup geometry is required. Native buttons are the shared action primitive. Native dialog owns focus containment and Escape. Character buttons are equivalent navigation to walking. No network states. Browser storage is optional; its failure never blocks play.
## Do's and Don'ts
Keep all copy in the selected language, including canvas labels and exported journals. Explain results through actual choices. Never equate worldview with goodness, diagnose users, or invent precision. Keep unanswered topics visibly unexplored. Avoid decorative dashboards and generated raster imagery.

## Result model
Six tendencies share 3 points per answered question, normalised to 100%. Method and answer allocations remain visible. These are game interpretations, never diagnostic probabilities. Locale changes preserve question IDs and scores, and rerender the current dialog. Version 2 saves use a separate key because the rewritten answers differ from version 1.
