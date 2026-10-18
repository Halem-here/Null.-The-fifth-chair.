# Changelog

## 2026-10-13 — first playable build
- Story bible with provisional canon (original Parts 1-6 were not available; only the continuity brief).
- Data: 33 evidence cards, 5 witness interviews, dock timeline puzzle, sign-off pages puzzle,
  10 verdict claims, 3-slot retelling with 4 addressees, thresholds, 7 endings.
- Engine (`js/engine.js`): classification, trust, flags, gated topics, verdict support rules,
  ending resolver, versioned localStorage save.
- UI (`index.html`, `css/style.css`, `js/ui.js`): title/continue/new game, six desk screens, ending.
- Tests: `tests/run.js` (47 engine/data checks), `tests/browser.py` (34 real-browser checks).
- Fixes found by testing: card x02 had no unlock path; `copiedProved` was never set; nav bar showed
  on the title screen (display:flex beat `hidden`); menu button was 37px tall on mobile;
  briefing date contradicted the rest of the timeline.

## 2026-10-14 — immersive redesign
- Presentation layer added without changing story data or rules: `art.js`, `ui-kit.js`, `data-links.js`, 28 local SVG assets, `tools/make-art.js`.
- New: inspection dialog, evidence board with pins, places, expandable timeline, portrait interviews, ending scenes, progress nav and next-step hint.
- Engine: additive only (`pins`, `relation`, `knownRelations`, `togglePin`, `progress`, `nextStep`). Score and ending logic untouched.
- Bugs found by the new tests and fixed: the DOM helper flattened only one array level (dialog metadata printed "[object HTMLElement]"); `append(null)` printed "null" in the board panel; board strings were created in the wrong XML namespace and never drew; "House Rule 4" label was uppercased by CSS; the next-step hint nagged forever about optional questions.
- Tests: 66 engine/data checks, 109 browser checks, all passing.

## 2026-10-14 — source audit (no canon changes)
- Trigger: a "story-first psychological thriller redesign" brief. Its Phase 1 requires the original Parts 1–6 and Continuity Brief; neither is in the project, so its stop rule applies and **no story, rules, thresholds, endings, ending conditions or character text were changed**.
- Added `CANON_AUDIT.md`: what was and was not available, REPORTED / PROVISIONAL / internal-CONTRADICTED / UNRESOLVED / IMPLEMENTATION ISSUE lists with file and line citations, a clue ledger for 16 clues, an ambiguity ledger for 7 open questions, and 9 questions for the original author.
- Added `tests/probes/ending-gates.js`: a probe (not part of the pass/fail suite) that reproduces issue I2, THE LETTER reachable without ruling on the messages.
- `STORY_BIBLE.md`: banner marking it not verified.
- `tests/browser.py`: new `settle()` helper so screenshots wait for finite animations. The saved screenshots had been captured mid-fade, almost black. Test assertions unchanged.
- Tests re-run: `node tests/run.js` 66 passed; `python3 tests/browser.py` 109 passed.
- Deliberately NOT done, pending the author: Phase 3 character-voice rewrites, new clues or scenes, ending prose or gate changes, retime of the 21:25 / 75-minute figure.

## 2026-10-15 — overhaul (author's brief)
The originals (Parts 1-6, Continuity Brief) are still missing. These changes follow the author's brief instead.
- Boat renamed ARLO -> MIST in data, art alt text, the 20:41 photograph (regenerated), generator, tests and docs. Arlo Penn unchanged. A test scans text and source files for any remaining "ARLO".
- `js/data-facts.js` added: one source for every time. 21:52 -> 22:40 = 48 minutes. The unsupported 21:25 arrival and 75-minute delay are gone and banned by tests.
- Evidence: `c08` no longer claims to say who bolted the door; `x04` no longer claims Nell's phone went silent at 01:15; `c06` (anonymous forum post) is now Guessed, not Struck; `k2` (Livia rescued Nell) needs Nell's text, the photo and Livia's account; `k1` also needs the photo; `k10` now says what Nell wrote, not what she did. Fixed "five different votes" (the sheet has three different answers).
- Engine: `needsAccount` for claims; endings are gated by the claims they state (`G.ENDING_RULES`) instead of a count; THE CARD also needs the SIM classed Fact; `endingBody` (conditional paragraphs); `explainEnding` (plain-English reasons).
- Writing: cards, interviews, board links, claims, retelling, endings and UI copy rewritten in simple English. Interview topic ids, requirements, unlocks and effects unchanged. Voices differ per character. Quoted cards match the interview word for word (tested).
- UI: Story screen (rules, how to play); "Case board"; each card shows what it shows and cannot show; timeline notes what the file does not say about 2015; ending page explains how the file read the answers.
- Design: bundled Inter and Lora (assets/fonts, no network); Lora replaces Source Serif 4, which could not be obtained; labels no longer all caps or widely spaced.
- Tests: 110 engine checks (was 66), 138 browser checks (was 109), all passing. `tests/probes/ending-gates.js` now ends in NO ANSWER.

## 2026-10-15 — final quality-review pass (checkpoint 6)
No rebuild; small fixes only. Boat MIST, Arlo Penn, the timeline and the evidence rules are unchanged.
- Layout bug (phones): the hidden "(complete)" text in finished nav buttons was absolutely positioned with no positioned ancestor, so it widened the page to 724px at 390px once several screens were done. `.sr` now has `left: 0` and nav buttons are `position: relative`. The old tests never checked a late-game state.
- Ending page: the same note could appear twice (two group-sentence choices, two hedges). `explainEnding` now gives one note per kind of mistake.
- Endings: THE FIVE no longer says the group called the vote unanimous unless Dess told the player so (`has: d05`); the unconditional "file points most at Dess … for the shared story" is replaced by a sentence the Dess flag supports. NO ANSWER: Wren does not know where her sister is (was: what happened to Arlo). NELL / THE FIVE: "the sentence Nell asked for".
- Places: the 20:41 photograph and Livia's rescue are no longer listed under the beach (they happened on the water). Okafor is no longer "the only statement from outside the group" (the depot clerk is also outside it). "Survived" for "lived".
- Dialogue: Dess's intro, "We couldn't find Arlo", Livia's rescue line and two stage directions, "I should have thought of the dot", "so Wren could sleep at night". Wren's question is now labelled "Ask what the phone company told her" and her answer matches the sender-data card (all fourteen from one prepaid number, not Nell's). Card note d03 and the d02/t02 board link no longer overstate the file.
- Tests: `tests/run.js` 121 (11 new: no-press route reaches every ending, core claims cite only records, deduped notes, conditional ending lines, places, text lint). `tests/browser.py` 200 (62 new: every screen and all seven endings at 390px and 1280px, no overflow, no repeated notes, images load). The new overflow test was confirmed to fail on the old CSS.
- Fonts: Source Serif 4 files are not on this machine (filesystem searched); Lora stays.


## 2026-10-16 — audit remediation, Roman Urdu and resilience

- Reconciled evidence and ending prose with what the supplied records actually support: no confirmed shore-arrival time, no inference that a text proves a voice call was possible, no time-of-death claim, no proven rope actor/intent, and no assumption that Nell left. Message sender attribution remains unresolved unless Livia’s SIM and admission are present.
- Tightened `k2` to require Nell’s text, the photograph and Livia’s account; `c06` remains Guessed; updated phone/SIM notes and case-board links to keep number ownership separate from human authorship.
- Reworked the ending requirements to be ending-specific. Preserved the eight-claim THE FIVE core, made the personal endings depend only on the claims and records they state, and set THE CARD’s Livia trust gate to the actual recoverable threshold. Added requirements checklist and non-repeating, evidence-specific explanations.
- Made the timeline and sign-off puzzles retryable, enabled Livia trust recovery after a press question, and hardened saves against malformed/older/future versions while preserving recovery data. Language preference is stored separately from game progress; switching language on the title screen no longer creates an empty save.
- Added offline English / Pakistani Roman Urdu localization with Latin-script text, locale source JSON, `tools/build-locale.py`, and dynamic UI/explanation templates. Current bundle: 712 exact entries, 106 patterns. The browser suite checks that rendered late-game screens and all endings have no missing Roman Urdu strings.
- Updated `README.md`, this state file, and `CANON_AUDIT.md` §11. The absent original Parts 1–6 and Continuity Brief remain an explicit canon limitation.
- Tests after implementation: `node tests/run.js` — 123 passed; `python3 tests/browser.py` — 266 passed across English/Roman Urdu, 390px touch and 1280px desktop, all seven endings, with no failures. Existing source archives and `backup/` copies were not edited.


## 2026-10-16 — narrative, dialogue and motif pass

- Established a self-contained working story blueprint: player starting knowledge, objectives, supported discoveries, open mysteries, voice notes and ending purpose. Reframed the audit as an internal draft review; removed the obsolete claim that missing source chapters block the story.
- Reframed the five chairs: the empty fifth seat is Nell’s place by the window, not a sixth seat for Arlo. Updated ending SVGs, alt text, Roman Urdu descriptions and the procedural art generator.
- Made rope language consistent (“untied,” not “cut”) and corrected the call-log relationship: Dess’s timing account remains testimony; the records neither prove nor disprove whether a voice call was possible earlier.
- Rewrote selected interview dialogue for more natural spoken rhythm and aligned quote cards, board explanations, endings and Roman Urdu source translations.
- Verification: `node tests/run.js` — 124 passed; `python3 tests/browser.py` — 266 passed (Chromium/Playwright).


## 2026-10-16 — natural-voice pass

- Smoothed dialogue and narration so characters sound less scripted; kept their facts, motives and uncertainty intact.
- Synced testimony-card quotes and case-board explanations with the revised dialogue.
- Rewrote source comments in the game, tests, art generator and stylesheet as concise maintainer notes.
- Refreshed Roman Urdu entries for the revised player-facing copy.
- Added 109 Roman Urdu source translations; the generated catalog now contains 838 exact entries and 108 patterns.
- Final verification: `node tests/run.js` — 124 passed, 0 failed; `python3 tests/browser.py` — 266 passed, 0 failed in Chromium/Playwright.
