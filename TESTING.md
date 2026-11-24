# Verification

- `node --test tests/` runs 13 tests: map/exit/spawn integrity, character placement, question reachability, worldview coverage, item/quest/secret references, scoring correctness (each worldview wins when its answers are chosen), and full story playthroughs with different answer choices.
- Browser check: driven in headless Chromium through the DevTools protocol. Covered the title, intro, name entry, walking, dialogue and menus, all 8 areas, the journal, the reveal and results page, and the phone layout with touch controls. No console errors.

Before presenting: play through once on the classroom machine and projector, and check that sound and the font load there.
