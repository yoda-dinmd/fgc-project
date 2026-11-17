# The Last Light

A classroom worldview adventure in English, Russian, and Romanian. Walk around Ashwick, meet four characters, make eight choices, and decide the fate of the beacon. About 8–15 minutes with discussion.

## Play locally
Open `index.html` in a modern browser. Keep `style.css`, `story.js`, `locales.js`, and `game.js` beside it. No installation, build, network, fonts, images, or server required. Progress is saved in browser storage when available.

Click the map to focus it, then use WASD / arrow keys and E. The character buttons provide a keyboard and touch alternative. Choose dialogue answers with A–D or the buttons. The journal explains each recorded decision and can be downloaded as text. You may finish without meeting everyone; unexplored topics stay unexplored.

## Present
One person controls the game on the projector. Invite the room to vote A/B/C/D, then select the winning response. This version has no networked voting. Results describe group choices, not individual classmates. Discuss one interpretation the audience agrees with and one they would challenge.

## Upload to GitHub Pages
Upload `index.html`, `style.css`, `story.js`, `locales.js`, and `game.js` to the root of a GitHub repository. In the repository's Pages settings, choose deployment from the main branch and root folder. No build step is needed. Keep a local copy for the presentation.

## Edit
- `story.js`: translated characters, contexts, questions, answers, and category allocations.
- `locales.js`: interface text, introduction, methodology, and endings in all three languages.
- `game.js`: movement, pixel scenery, dialogue, journal, saving, and endings.
- `style.css`: responsive visual styling.

The artwork is drawn directly in code; there are no generated raster assets. Replace it with your own sprites later if desired.

## Interpretation
This is an educational reflection exercise, not a validated psychological instrument. Results distribute points across six tendencies: evidence and reason, spirituality and tradition, freedom and self-created meaning, human welfare and care, community and shared duties, and scepticism and openness. Each answer gives 2 points to a primary tendency and 1 to a secondary tendency. Percentages are shares of allocated points, rounded to total 100%; they are not probabilities of membership in a philosophy. There are no good/evil points. The method and each answer’s allocation are visible in the journal. Practical actions do not uniquely determine philosophical beliefs. Topics include knowledge, meaning, metaphysics, ethics, agency, and communal obligations. Fictional characters do not represent entire religions or philosophical schools.

## Version 2
The short introduction plays on a new journey and can be replayed from the page. Every dialogue has an initially expanded context panel. Language can be changed in the header or inside any dialog without losing progress. Downloads use the selected language. Rewritten answers use a new save key, so version 1 answers are not reinterpreted as version 2 choices.

## Checks
Run `node tests/story.test.cjs` and `node tests/flow.test.cjs`. The flow harness checks logic with a simulated DOM; it is not a substitute for browser visual testing.
