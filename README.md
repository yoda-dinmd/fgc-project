# The Examined Life

A small pixel-art RPG for a philosophy course. You wake up in a strange little town with no memory of who you are or what you believe. You walk around, talk to people, answer their questions and run their errands. At the end, a mirror in the lighthouse shows which worldview you lean towards. It takes about 20–30 minutes.

## Play
Open `index.html` in a modern browser. There is nothing to install or build. Progress saves automatically in the browser, so you can close the tab and press **Continue** later.

| Key | Action |
|---|---|
| Arrows / WASD | Walk |
| Z / E / Enter / Space | Talk, confirm, skip text |
| X / Esc | Back / leave a conversation |
| Q | Journal (quests, items, progress) |
| M | Sound on/off |

Phones and tablets get an on-screen D-pad and A/B buttons. The pixel font (VT323) comes from Google Fonts; offline, the game falls back to the system monospace font and still works.

## What's in it
- **8 areas:** Village Square, Laboratory, Temple & Zen Garden, Whispering Forest, the Cave, the Market (Agora), Café & Library, and the Lighthouse.
- **16 characters, each secretly a worldview.** They are revealed only at the end: Dr. Quark the scientist (naturalism/atheism), Brother Anselm (theism), Rémy in the café (existentialism), Raven the goth kid (nihilism), Mira the gardener (stoicism), Bella the baker (Epicureanism), Mr. Tally the accountant (utilitarianism), Clerk Ought (Kantian ethics), Kiri the meditator (Buddhism), Sylva the forest spirit (pantheism), Gus the mechanic (pragmatism), Inspector Hume (skepticism/agnosticism), Syd and his boulder (absurdism), Rosa the organiser (collectivism), Mr. Penny the merchant (libertarianism) and Dio in his barrel (cynicism).
- **Undertale-style dialogue:** a typewriter text box with a portrait and a menu of questions you can ask each character.
- **6 quests that chain between characters:** fix the lighthouse gate (wrench from the lab), the lost prayer book, the case of the missing acorn (croissant → dog → acorn → spirit → detective), the union petition, a black coffee for Rémy, and Raven's dare to enter the cave.
- **17 hidden secrets:** "I bark, therefore I am", Schrödinger's box, a brain in a jar, Plato's cave, the duck-rabbit, the Ship of Theseus, Zeno's sign, the trolley problem as a toy railway, name easter eggs (try "Socrates" or "Kant"), and more.
- **The ending:** a radar chart across all 16 worldviews, your top three with short explanations and thinkers to read, every character's secret identity, and a "how was this worked out?" section listing each of your answers and the points it gave.

## How scoring works
36 questions are spread across the characters (you need at least 12 to use the mirror). Each answer quietly gives 2 points to one worldview and 1 to a related one. Some worldviews come up more often than others, so a worldview's score is the points you gave it divided by the points that were on offer for it in the questions you answered, plus a small smoothing constant. This is a game for reflection, not a validated psychological test, and the results screen says so.

## Editing
- `data.js` holds **all story content**: worldviews, characters, dialogue, questions and their points, items, quests, secrets and maps. The format is documented at the top of the file.
- `scoring.js` is the hidden scoring maths.
- `sprites.js` draws the pixel art in code (tiles, characters, animals), so there are no image files.
- `game.js` is the engine: movement, dialogue box, script runner, journal, saving and the results screen.
- `style.css` styles the page.

## Tests
```
node --test tests/
```
These check the maps, spawn points, that every question can be reached, score balance and the scoring maths. They also play the story logic end to end, which proves every quest chain can be finished and the ending is reachable.

## Publish on GitHub Pages
Push the repository, then in Settings → Pages choose "Deploy from a branch", `main`, root folder.
