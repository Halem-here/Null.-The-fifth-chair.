# NULL — The Fifth Chair

A static, offline browser mystery game about a boat, a vote, and the story a group agreed to tell.

## Run the game

No installation or build step is required. From this folder, run:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. You can also open `index.html` directly in a browser. Progress is stored only in that browser; it is not sent to a server.

Use the language buttons at the top to switch between **English** and **Pakistani Roman Urdu** (Latin script). Your language preference is saved separately from your game progress.

## Tests and locale maintenance

```sh
node tests/run.js
python3 tests/browser.py
```

The browser suite needs Playwright and its Chromium browser. The editable Roman Urdu JSON files are in `locales/roman-urdu/`; rebuild the bundled, offline catalog after editing them with:

```sh
python3 tools/build-locale.py
```

## Story note

This project is the working story draft; there is no separate canon packet being treated as authority. `STORY_BIBLE.md` records the current design, established evidence and open mysteries. `CANON_AUDIT.md` is an internal consistency review, not an external canon check.
