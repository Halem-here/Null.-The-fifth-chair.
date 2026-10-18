# NULL — Project State

Last updated: 2026-10-16. This ZIP is the current self-contained working story draft; there is no separate canon/source packet being used as authority. This file describes the evidence, ending-gate, save-recovery, localization and browser-test updates. See `CANON_AUDIT.md` for the internal draft review and exact gates.

## A. Project and run instructions

- **NULL — The Fifth Chair** is a static, offline HTML/CSS/JavaScript browser mystery. No build step, backend, third-party library or network request is needed.
- Run from this folder with `python3 -m http.server 8000` and open `http://localhost:8000` (or open `index.html` directly). Save data remains in the current browser.
- The title screen offers **English** and **Pakistani Roman Urdu** in Latin script. The language preference is stored independently from progress.
- Read `README.md` for player setup and test commands.

## B. Project map

- `index.html`, `css/style.css` — page shell, accessible controls, responsive presentation and locally bundled fonts.
- `js/data-facts.js` — canonical boat, victim and known times shared across the game.
- `js/data-cards.js`, `js/data-interviews.js`, `js/data-story.js`, `js/data-links.js` — evidence, testimony, timeline, claim and ending data.
- `js/engine.js` — state, evidence rules, save repair, puzzle answers, claim verdicts and ending eligibility.
- `js/art.js`, `js/ui-kit.js`, `js/ui.js` — art metadata, artifact rendering, screens and interactions.
- `js/i18n.js`, `js/data-locale.js` — offline localization runtime and generated bundle.
- `locales/roman-urdu/*.json`, `tools/build-locale.py` — editable locale source and bundle builder. Current catalog: 838 exact strings and 108 templates.
- `assets/` — original procedural SVG art and locally bundled Inter/Lora font files. The browser test loads 23 image assets.
- `tests/run.js`, `tests/browser.py`, `tests/probes/` — engine/data regression tests, browser integration checks and a diagnostic probe.
- `STORY_BIBLE.md`, `CANON_AUDIT.md`, `CHANGELOG.md` — current story blueprint, internal draft review and dated project history.
- `backup/` — preserved archive copies; none were edited during this pass.

## C. Evidence and story safeguards

- `MIST` is the boat; Arlo Penn is the victim. Times are centralized in `data-facts.js`.
- The recorded 21:52 message and 22:40 emergency call are 48 minutes apart. The shore-arrival time is not in the file. The text record does not establish that an emergency voice call was possible at 21:52, when Arlo died, or what the delay changed.
- The anonymous forum post is Guessed, not proof. All rope references use “untied”; the identity or intent of whoever untied it, Livia’s knowledge of Nell’s location, Nell’s current whereabouts/fate, and the messages’ author absent the SIM admission stay unresolved. Dess’s “called when we could” account is Told: the text message alone does not establish whether a voice call was possible.
- `k7` is conditional: before the SIM admission, the author ruling remains NULL; after the player has the SIM card and Livia’s admission, the supported ruling changes. A number or sign-off alone does not identify the human sender.
- The timeline labels the 2016 vote night without asserting that Nell left. Her page says she planned to leave; the file does not confirm whether or where she went.
- Puzzle attempts can be corrected. Livia’s press route can recover trust; the personal ending gate reflects the actual trust threshold.
- Ending explanations are assembled from the selected ending’s own requirements and avoid repeating duplicate notes. A supported NULL answer is treated as valid uncertainty, not as a mistake.

## D. Current ending gates

All endings require a complete three-slot retelling and a selected addressee. The engine checks in this order:

1. **STRUCK** — wrong-strike weight reaches 6.
2. **THE SAME SENTENCE** — at least two retelling slots repeat the group’s agreed line.
3. **NELL / THE FIVE** — addressee Nell; Wren-forwarded flag; correct timeline and pages answers; `x02` and `x04` Fact; claims `k1`, `k3`, `k5`, `k6`, `k7`, `k9` supported.
4. **THE CARD** — addressee Livia; SIM found and `x03` Fact; Livia trust at least 2; `k7` and `k8` supported.
5. **THE LETTER** — addressee Wren; trust at least 4; Wren-forwarded flag; `x02` and `x04` Fact; `k1`, `k3`, `k7`, `k9` supported.
6. **THE FIVE** — all eight core claims (`k1`, `k3`–`k9`) supported.
7. Otherwise **NO ANSWER** — the completed retelling is not fully owned by the evidence or no other ending gate succeeds.

See `CANON_AUDIT.md` for supporting details and tests of each branch.

## E. Verification

Latest successful runs before final packaging:

- `node tests/run.js` — **124 passed, 0 failed**. Covers save migration/recovery, claim requirements, endings, localization key coverage, Roman Urdu dynamic templates, Latin-script check and core evidence consistency.
- `python3 tests/browser.py` — **266 passed, 0 failed** in Chromium/Playwright. Covers the real UI, save/resume, title language switch, interviews, evidence, board, places, timeline, retelling, all seven endings, and desktop/phone layouts in English and Roman Urdu; it also checks image loading, missing translations, console/page errors, network requests, touch sizes, focus and overflow.
- Browser checks use 390×844 touch emulation and 1280×800 desktop. This is not a Safari/Firefox or real-device certification.

Re-run with `node tests/run.js` and `python3 tests/browser.py`; the latter requires Playwright Chromium. Rebuild locale data with `python3 tools/build-locale.py` after editing JSON translations.

## F. Canon status, backups and limitations

- The project is a self-contained working draft. `STORY_BIBLE.md` records its present choices and open mysteries; it is not an assertion of an external canon. The audit is about consistency inside the supplied draft.
- No human editorial read-through of all dialogue and Roman Urdu has been completed. Browser coverage checks rendering and missing keys, not literary taste or canon correctness.
- Only Chromium was used. Safari, Firefox, real phones and older devices have not been tested. SVG art is procedural rather than painted illustration.
- The uploaded source archive and both in-project archives are retained unchanged. SHA-256: uploaded `NULL-overhaul(1).zip` — `8160cf2e3374049dc581005c9e0857a21b1c1282614cd5fca8967ea8eacd9480`; `backup/null-original.zip` — `7e7c9a288669d3e5fcd5b680701428ee5c5c4b4d25e01bbc494a0e18d54318d0`; `backup/null-overhaul-pre-review.zip` — `3cd2ac6ce9732c2367fd9b399eed49ee06155f801e10ca2aac1c0d35e52a6e10`.

## G. Recommended next step

Continue from the current story blueprint and internal review. The next useful pass is an authorial read-through for pacing, voice and emotional payoff—not a comparison to an external canon.
