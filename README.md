# Fairfield Road

A road-trip board game for 2–6 teams, played on one shared screen (a projector works well).
Plain HTML/CSS/JS: no build step, no dependencies, works offline.

## Run

Double-click `index.html`. If your browser blocks something, serve the folder instead:

```
npx serve .
# or
python -m http.server
```

## How to play

1. Choose 2–6 teams (name, vehicle, colour), optionally shuffle the order and enable the answer timer, then **Start**.
2. The host presses **Roll dice** (or Space). The team's token hops forward that many tiles.
3. The tile the token landed on pulses. **Click it** (or press Enter):
   - **Question tile** – a random question opens. Answer correctly: stay. Wrong (or out of time): back 1 tile.
     Multiple-choice questions are marked automatically; open-ended ones use the host's Correct / Wrong buttons after "Reveal answer".
   - **Function tile** – the effect applies. If that move (or a wrong answer's step back) lands on another function tile, that tile triggers too (click it again).
     Landing on a question tile ends the chain and the turn, without a question. Chains are capped at 8 per turn.
4. First team to reach (or pass) Finish wins. The other teams then get tie-breaker questions in turn order; the first correct answer takes 2nd place
   (if nobody answers correctly, the team furthest along the board takes 2nd).

| Tile | Effect |
|---|---|
| +1 lượt / Roll again | Roll once more (max 1 extra roll per turn; the second roll's tile resolves normally) |
| Nhảy 3 ô / Jump 3 | Move forward 3 |
| Lùi 1 ô / Lùi 2 ô | Move back 1 / 2 (never past Start) |
| Chọn 1/5 ô / Pick 1 of 5 | Click one of the next 5 tiles to move there |

## Customising

- **In the app:** the **Questions & tiles** button edits both question pools (open or multiple choice, optional per-question time limit),
  the order of tile types, and imports/exports JSON (you can also drag a `.json` file onto the editor).
  Edits are saved in the browser. "Reset to defaults" restores `config/game-config.js`.
- **Defaults file:** edit `config/game-config.js` (layout, timer defaults, starter questions).
  Question text can be a string or `{ "vi": "...", "en": "..." }`.
- **Language:** the VI / EN toggle in the top bar. UI strings are in `js/i18n.js`.
- The game autosaves; refreshing the page resumes the current game.

### JSON format (import / export)

```json
{
  "layout": ["question", "rollAgain", "jump3", "... 24 entries ..."],
  "questions": [
    { "q": "Open question?", "a": "Answer" },
    { "q": { "vi": "Câu hỏi?", "en": "Question?" }, "choices": ["A", "B", "C"], "answer": 1, "timeLimit": 20 }
  ],
  "tiebreakQuestions": [ { "q": "…", "a": "…" } ]
}
```
Tile types: `question`, `rollAgain`, `jump3`, `back1`, `back2`, `choose5`. `answer` is the 0-based index of the right choice.
Every key is optional on import.

## Files

```
index.html, css/styles.css
config/game-config.js   defaults: layout, timer, questions
js/engine.js            rules only (no DOM), testable in Node
js/board.js             SVG board + token animation
js/ui.js                setup, turn flow, pop-ups, results
js/editor.js            question / layout editor
js/i18n.js, js/storage.js
test/engine.test.js     node test/engine.test.js
```

## Tests

```
node test/engine.test.js
```
