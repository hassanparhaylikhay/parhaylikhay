# Lesson tests

Browser tests for the beat lessons (`components/beats/`). Each script drives
Chrome against a production build of the site, the way a student would, and
checks what is on screen.

```bash
npm run test:lessons        # quick suite: build, start, open every beat of every lesson (~10 min)
npm run test:lessons:full   # everything below (~1 hour)
node tests/lessons/run.mjs list                       # every job by name
node tests/lessons/run.mjs play:pythagoras walk:circle-3   # just these
HOST=https://parhaylikhay.com node tests/lessons/run.mjs cold:angles   # against the live site
```

Run the full suite before shipping a new lesson or a change to a lesson's
board. CI (`.github/workflows/lessons.yml`) runs the quick suite on every push.

| Job | What it checks |
|---|---|
| `cold:<lesson>` | Every beat opened directly (`?beat=N`): no page errors, no KaTeX errors, no NaN on screen, a phrase showing |
| `walk:<lesson>` | Every "Show me how": it appears after 30 s or 3 wrong answers, each step changes the phrase, the keypad comes back, the right answer moves on |
| `play:<lesson>` | A full play-through as a student, mouse, desktop size: every phrase in order, every task done, wrong attempts get their note |
| `play-phone:<lesson>` | The same with touch at 390 x 844 |
| `fuzz:<lesson>` | Random drags at random screen sizes; after each, the maths on screen must still hold and labels stay on screen |
| `cards` | Part titles: show on open and when moving forward, never with `?beat=N` or going back; a tap skips |
| `note` | A note always sits under the phrase's last line |
| `overshoot` | A finger that runs on past a target (a fast flick past the diameter) still clicks the point in, and the beat moves on |
| `near-miss` | A length that is not the target never reads as the target (√170 shows 13.04, not 13) |
| `o-letter`, `right-mark` | The letter O and the right-angle mark never flick from side to side |
| `flash` | Only what the student touched flashes green |

Settings: `HOST` (default `http://localhost:3124`), `CHROME_PATH` (Chrome or
Chromium; found automatically on a Mac and on Linux), `OUT` (screenshots;
default a temp folder), `WIDTH` (jobs at once, default 3). Logs of each run
are in `<temp>/lesson-tests/logs/`.

`shots.cjs` (with `LESSON=<slug>`) screenshots every beat, and
`contact-sheet.py <folder> <out>` lays them out on sheets for review.

When a lesson's wording changes, the play-through for that lesson waits for
the new phrase: update its `want("...")` lines.
