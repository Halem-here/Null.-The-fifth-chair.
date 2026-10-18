# NULL — Internal Draft Review

Updated: 2026-10-16. This document reviews the story as it exists in this project. There is no separate canon/source packet being treated as authority. The game, `STORY_BIBLE.md`, and this review form the current working draft.

## Story premise and player promise

A year after five friends voted about what happened to Arlo Penn, an outside reader is asked to examine the file at the Hartwell house. MIST capsized at Greywater in 2015; Arlo was later found drowned. The records preserve a text from Dess’s phone at 21:52 and the first emergency call at 22:40. The next year’s vote was not unanimous, despite the group’s shared account. Nell asked them to say what happened, then left a page saying she would not return to the table. Later, Livia admits using a prepaid SIM to impersonate Nell in messages to Wren.

The player’s job is not to name a culprit at any cost. They sort evidence, interview the five friends, reconstruct the timeline, judge claims TRUE / FALSE / NULL, and choose what to tell someone. The dramatic skill is separating records from testimony, and both from inference.

## What the draft establishes

- MIST capsized at 20:41; the image does not identify people in the water.
- Arlo was found drowned at 07:10 the next morning. The coroner’s record does not give his time of death.
- Dess’s phone sent “All safe.” at 21:52; the first emergency call came at 22:40, a 48-minute gap. The file does not prove when a voice call became possible, why the call came later, or whether the delay changed anything.
- Dess admits sending the message to stop Arlo’s mother calling. This is a consequential lie, but it does not prove she caused Arlo’s death or untied the rope.
- Teo says Dess wanted the group to agree on what to say before anyone called. This remains testimony, not independent proof.
- The vote sheet records Dess and Corin as TRUE, Teo and Livia as NULL, and Nell as FALSE. “Everyone voted NULL” is contradicted by the sheet.
- Nell’s page establishes what she wrote and suggests an intention to leave. It does not establish whether she left, where she went, or whether she is alive.
- Livia admits writing as Nell from the prepaid number found in her coat. This establishes the impersonation, not Nell’s whereabouts or Livia’s knowledge of them.

## Questions intentionally left open

1. Who untied MIST’s rope, and whether that person intended harm.
2. Whether Arlo was alive when the 21:52 message was sent.
3. Whether an emergency voice call was possible before 22:40, and whether waiting mattered.
4. Whether the object Teo heard dragged downstairs was Nell’s bag.
5. Whether Nell left, where she went, and whether she is alive.
6. Whether Livia knows where Nell is.

A text message is not evidence that voice service was available. Two inconsistent memories do not resolve the rope. A missing person’s empty chair is not proof of death.

## The chair motif

There are five friends and five chairs. Nell had asked for the seat by the window; one year later it is empty. The fifth chair is Nell’s place among the five, not an extra place for Arlo. It conveys absence without asserting Nell’s fate. All game art, ending copy, alt text, and the procedural art generator should preserve this reading.

## Writing and presentation decisions in this pass

- Dialogue was shortened and made more conversational, with contractions, pauses and distinct character rhythms. Evidence cards that quote a witness match that witness’s interview exactly.
- “Cut the line” was removed from the rope mystery. The draft consistently asks who untied the rope; cutting and untying are different acts.
- Dess’s “called when we could” remains a reported account. The call log is linked as uncertain, not as proof that she could call earlier.
- The vote, delay, SIM admission and unsolved questions now carry the mystery; the story does not need a manufactured contradiction to create tension.
- Roman Urdu translations were updated for changed dialogue, evidence cards, endings and image descriptions.

## Player-facing arc

At the beginning, the player knows the boat capsized, Arlo died, the five friends later voted, and Nell’s place is empty. They do not yet know what the vote recorded, why Mrs Penn received “All safe.”, or who wrote Wren’s messages. Their work reveals the false consensus and Livia’s impersonation while leaving the rope, the 48-minute gap’s meaning, and Nell’s fate unresolved. A strong ending states both what the file proves and what it cannot say.

## Verification and limits

- `node tests/run.js`: 124 passed, 0 failed.
- `python3 tests/browser.py`: 266 passed, 0 failed in Chromium/Playwright, including English and Pakistani Roman Urdu at phone and desktop sizes, all seven endings, missing-translation checks, image loading and no console/page errors.
- Passing tests show consistency and rendering; they do not establish artistic quality. The project has not had a full human literary read-through, and Safari/Firefox/real-device coverage remains untested.
