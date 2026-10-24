/* Game rules, kept separate from the browser UI so tests can run the same code.
 * State stays JSON-serialisable because it is also the save file.
 */
(function (root) {
  const G = (root.NULLGAME = root.NULLGAME || {});
  const CLASSES = ['fact', 'told', 'guessed', 'struck'];
  const VERDICTS = ['TRUE', 'FALSE', 'NULL'];
  const SAVE_KEY = 'null.save.v1';
  const RECOVERY_KEY = 'null.save.recovery.v1';
  const LANG_KEY = 'null.language.v1';
  const SAVE_VERSION = 2;
  const MAX_NOTE_LENGTH = 5000;
  const MAX_QUESTIONS = 20;
  const MAX_QUESTION_LENGTH = 240;

  const cardById = (id) => G.CARDS.find((c) => c.id === id);
  const claimById = (id) => G.CLAIMS.find((c) => c.id === id);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  function newState() {
    return {
      v: SAVE_VERSION,
      lang: 'en',
      screen: 'title',
      unlocked: G.CARDS.filter((c) => c.start).map((c) => c.id),
      classes: {},
      trust: Object.assign({}, G.START_TRUST),
      flags: {},
      asked: [],
      timeline: null,   // chosen option id
      pages: null,      // chosen option id
      verdicts: {},
      retell: {},
      addressee: null,
      ending: null,
      pins: [],         // saved board connections, as "idA|idB" (sorted)
      notes: '',
      openQuestions: [],
    };
  }

  function setNotes(state, value) {
    if (typeof value !== 'string' || value.length > MAX_NOTE_LENGTH) return { ok: false, reason: 'invalid note' };
    state.notes = value;
    return { ok: true };
  }

  function addOpenQuestion(state, value) {
    if (typeof value !== 'string' || !value.trim()) return { ok: false, reason: 'empty' };
    const text = value.trim();
    if (text.length > MAX_QUESTION_LENGTH) return { ok: false, reason: 'too long' };
    if (state.openQuestions.length >= MAX_QUESTIONS) return { ok: false, reason: 'limit' };
    if (state.openQuestions.some((q) => q.toLowerCase() === text.toLowerCase())) return { ok: false, reason: 'duplicate' };
    state.openQuestions.push(text);
    return { ok: true };
  }

  function removeOpenQuestion(state, index) {
    if (!Number.isInteger(index) || index < 0 || index >= state.openQuestions.length) return { ok: false, reason: 'unknown question' };
    state.openQuestions.splice(index, 1);
    return { ok: true };
  }

  // cards

  // Return the card’s current class, including any flag-based changes.
  function effectiveTruth(card, state) {
    let truth = card.truth;
    for (const rule of card.truthIf || []) {
      if (state.flags[rule.flag]) truth = rule.truth;
    }
    return truth;
  }

  function classify(state, cardId, cls) {
    if (!cardById(cardId)) return { ok: false, reason: 'unknown card' };
    if (!state.unlocked.includes(cardId)) return { ok: false, reason: 'card not unlocked' };
    if (cls !== null && !CLASSES.includes(cls)) return { ok: false, reason: 'unknown class' };
    if (cls === null) delete state.classes[cardId];
    else state.classes[cardId] = cls;
    return { ok: true };
  }

  // Conflicts among unlocked cards that have not been struck.
  function activeContradictions(state) {
    const live = (id) => state.unlocked.includes(id) && state.classes[id] !== 'struck';
    return G.CONTRADICTIONS.filter((p) => live(p.a) && live(p.b));
  }

  // investigation board
  // The board shows links from the data files. It never changes the score.

  const pairKey = (a, b) => [a, b].sort().join('|');

  // Return null when there is no recorded link. Status is disputed, resolved, supported or uncertain.
  function relation(state, a, b) {
    if (a === b || !state.unlocked.includes(a) || !state.unlocked.includes(b)) return null;
    const same = (x) => (x.a === a && x.b === b) || (x.a === b && x.b === a);
    const clash = (G.CONTRADICTIONS || []).find(same);
    if (clash) {
      const struck = state.classes[a] === 'struck' || state.classes[b] === 'struck';
      return { kind: 'contradiction', status: struck ? 'resolved' : 'disputed', why: clash.why };
    }
    const link = (G.LINKS || []).find(same);
    if (!link) return null;
    const bothFact = state.classes[a] === 'fact' && state.classes[b] === 'fact';
    return { kind: link.kind, status: link.kind === 'supports' && bothFact ? 'supported' : 'uncertain', why: link.why };
  }

  // Return links between cards currently in the file.
  function knownRelations(state) {
    const out = [];
    for (const x of [...(G.CONTRADICTIONS || []), ...(G.LINKS || [])]) {
      const r = relation(state, x.a, x.b);
      if (r) out.push(Object.assign({ a: x.a, b: x.b }, r));
    }
    return out;
  }

  function togglePin(state, a, b) {
    if (!relation(state, a, b)) return { ok: false, reason: 'no relationship in the file' };
    const key = pairKey(a, b);
    const i = state.pins.indexOf(key);
    if (i >= 0) { state.pins.splice(i, 1); return { ok: true, pinned: false }; }
    state.pins.push(key);
    return { ok: true, pinned: true };
  }

  // interviews

  function topicAvailable(state, sourceId, topic) {
    if (state.asked.includes(topic.id)) return { ok: false, reason: 'asked' };
    const r = topic.requires;
    if (!r) return { ok: true };
    if (r.card && !state.unlocked.includes(r.card)) return { ok: false, reason: 'card' };
    if (r.flag && !state.flags[r.flag]) return { ok: false, reason: 'flag' };
    const trust = state.trust && Number.isFinite(state.trust[sourceId]) ? state.trust[sourceId] : -1;
    if (r.trustMin !== undefined && trust < r.trustMin) return { ok: false, reason: 'trust' };
    if (r.trustMax !== undefined && trust > r.trustMax) return { ok: false, reason: 'trust' };
    return { ok: true };
  }

  function findTopic(sourceId, topicId) {
    const iv = G.INTERVIEWS[sourceId];
    return iv ? iv.topics.find((t) => t.id === topicId) : null;
  }

  function ask(state, sourceId, topicId) {
    const topic = findTopic(sourceId, topicId);
    if (!topic) return { ok: false, reason: 'unknown topic' };
    const avail = topicAvailable(state, sourceId, topic);
    if (!avail.ok) return { ok: false, reason: avail.reason };
    state.asked.push(topic.id);
    const fx = topic.effects || {};
    const gained = [];
    for (const id of fx.unlock || []) {
      if (!state.unlocked.includes(id)) { state.unlocked.push(id); gained.push(id); }
    }
    for (const [src, delta] of Object.entries(fx.trust || {})) {
      state.trust[src] = clamp((state.trust[src] || 0) + delta, 0, 5);
    }
    Object.assign(state.flags, fx.flags || {});
    return { ok: true, lines: topic.lines, gained };
  }

  // puzzles

  function answerTimeline(state, optionId) {
    const opt = G.TIMELINE.options.find((o) => o.id === optionId);
    if (!opt) return { ok: false, reason: 'unknown option' };
    state.timeline = optionId;
    return { ok: true, correct: !!opt.correct };
  }

  function answerPages(state, optionId) {
    const opt = G.PAGES.options.find((o) => o.id === optionId);
    if (!opt) return { ok: false, reason: 'unknown option' };
    state.pages = optionId;
    return { ok: true, result: opt.result };
  }

  const timelineCorrect = (s) => !!s.timeline && !!G.TIMELINE.options.find((o) => o.id === s.timeline).correct;
  const pagesCorrect = (s) => !!s.pages && G.PAGES.options.find((o) => o.id === s.pages).result === 'correct';

  // verdicts

  function setVerdict(state, claimId, verdict) {
    if (!claimById(claimId)) return { ok: false, reason: 'unknown claim' };
    if (verdict !== null && !VERDICTS.includes(verdict)) return { ok: false, reason: 'unknown verdict' };
    if (verdict === null) delete state.verdicts[claimId];
    else state.verdicts[claimId] = verdict;
    return { ok: true };
  }

  // TRUE/FALSE needs supporting Fact cards. NULL does not.
  function claimCorrect(state, claim) {
    let correct = claim.correct;
    for (const rule of claim.correctIf || []) if (state.flags && state.flags[rule.flag]) correct = rule.truth;
    return correct;
  }

  function claimWhy(state, claim) {
    let why = claim.why;
    for (const rule of claim.whyIf || []) if (state.flags && state.flags[rule.flag]) why = rule.text;
    return why;
  }

  function claimStatus(state, claim) {
    const v = state.verdicts[claim.id];
    if (!v) return 'unjudged';
    if (v !== claimCorrect(state, claim)) return 'wrong';
    const needsProof = claimCorrect(state, claim) !== 'NULL';
    const backed = !needsProof || (claim.needs || []).every((id) => state.classes[id] === 'fact' && state.unlocked.includes(id));
    const flagBacked = claimCorrect(state, claim) !== 'TRUE' || !claim.needsFlag || !!(state.flags && state.flags[claim.needsFlag]);
    // Account cards must be in the file and marked Fact or Told.
    const onRecord = !needsProof || (claim.needsAccount || []).every((id) => ['fact', 'told'].includes(state.classes[id]) && state.unlocked.includes(id));
    return backed && onRecord && flagBacked ? 'supported' : 'unbacked';
  }

  // retelling

  function chooseRetell(state, slot, optionId) {
    const group = G.RETELL[slot];
    if (!group) return { ok: false, reason: 'unknown slot' };
    if (!group.options.some((o) => o.id === optionId)) return { ok: false, reason: 'unknown option' };
    state.retell[slot] = optionId;
    return { ok: true };
  }

  function chooseAddressee(state, id) {
    if (!G.ADDRESSEES.some((a) => a.id === id)) return { ok: false, reason: 'unknown addressee' };
    state.addressee = id;
    return { ok: true };
  }

  const retellTags = (state) =>
    Object.entries(state.retell).map(([slot, id]) => G.RETELL[slot].options.find((o) => o.id === id).tag);

  const retellComplete = (state) => Object.keys(G.RETELL).every((s) => state.retell[s]) && !!state.addressee;

  // scoring

  function score(state) {
    let strikeWrong = 0;
    for (const [id, cls] of Object.entries(state.classes)) {
      const card = cardById(id);
      if (cls === 'struck' && effectiveTruth(card, state) !== 'struck') strikeWrong += card.weight;
    }
    const supported = G.CLAIMS.filter((c) => claimStatus(state, c) === 'supported').length;
    const tags = retellTags(state);
    return {
      strikeWrong,
      supported,
      agreed: tags.filter((t) => t === 'agreed').length,
      owned: tags.filter((t) => t === 'owned').length,
      allOwned: tags.length === Object.keys(G.RETELL).length && tags.every((t) => t === 'owned'),
    };
  }

  // Endings require supported claims. THE FIVE uses the core set; personal endings use their own lists.
  const coreSupported = (state) => G.ENDING_RULES.core.every((id) => claimStatus(state, claimById(id)) === 'supported');

  // Check endings in order: unsupported strikes, repeating the group’s line, then unanswered claims.
  function resolveEnding(state) {
    if (!retellComplete(state)) return { ok: false, reason: 'incomplete' };
    const s = score(state);
    const T = G.THRESHOLDS;
    let ending;
    if (s.strikeWrong >= T.strikeWrong) ending = 'STRUCK';
    else if (s.agreed >= 2) ending = 'THE SAME SENTENCE';
    else if (!s.allOwned) ending = 'NO ANSWER';
    else {
      const hasClaims = (ids) => ids.every((id) => claimStatus(state, claimById(id)) === 'supported');
      const letterGate = state.trust.wren >= T.trustLetter && !!state.flags.wrenForwarded &&
        state.classes.x02 === 'fact' && state.classes.x04 === 'fact' && hasClaims(['k1', 'k3', 'k7', 'k9']);
      const cardGate = !!state.flags.simFound && state.classes.x03 === 'fact' &&
        state.trust.livia >= T.trustCard && hasClaims(['k7', 'k8']);
      const nellGate = !!state.flags.wrenForwarded && timelineCorrect(state) && pagesCorrect(state) &&
        state.classes.x02 === 'fact' && state.classes.x04 === 'fact' && hasClaims(['k1', 'k3', 'k5', 'k6', 'k7', 'k9']);
      if (state.addressee === 'nell' && nellGate) ending = 'NELL / THE FIVE';
      else if (state.addressee === 'livia' && cardGate) ending = 'THE CARD';
      else if (state.addressee === 'wren' && letterGate) ending = 'THE LETTER';
      else if (coreSupported(state)) ending = 'THE FIVE';
      else ending = 'NO ANSWER';
    }
    state.ending = ending;
    state.screen = 'ending';
    return { ok: true, ending };
  }

  // Keep only ending paragraphs whose conditions the player met.
  function endingBody(state, name) {
    const e = G.ENDINGS[name || state.ending];
    if (!e) return [];
    const ok = (c) => !c || ((!c.flag || !!state.flags[c.flag]) && (!c.notFlag || !state.flags[c.notFlag]) && (!c.fact || state.classes[c.fact] === 'fact') && (!c.has || state.unlocked.includes(c.has)));
    return e.body.map((b) => (typeof b === 'string' ? { t: b } : b)).filter((b) => ok(b.if)).map((b) => b.t);
  }

  // Explain the result without changing the save state.
  function explainEnding(state) {
    const lines = [];
    const struckWrong = Object.entries(state.classes).filter(([id, c]) => c === 'struck' && effectiveTruth(cardById(id), state) !== 'struck').map(([id]) => cardById(id).title);
    if (struckWrong.length) lines.push({ kind: 'strike', text: 'You struck out these cards that nothing in the file disproves: ' + struckWrong.join('; ') + '. Strike a card only when a Fact contradicts it. If you simply cannot check it, mark it Told or Guessed.' });
    G.CLAIMS.forEach((c) => {
      const st = claimStatus(state, c), v = state.verdicts[c.id];
      if (st === 'supported') return;
      if (st === 'unjudged') lines.push({ kind: 'claim', text: 'You did not rule on this claim: “' + c.text + '” ' + claimWhy(state, c) });
      else if (st === 'wrong') lines.push({ kind: 'claim', text: 'You ruled ' + v + ' on this claim: “' + c.text + '” ' + claimWhy(state, c) });
      else {
        const missing = (c.needs || []).filter((id) => !(state.classes[id] === 'fact' && state.unlocked.includes(id))).concat((c.needsAccount || []).filter((id) => !(['fact', 'told'].includes(state.classes[id]) && state.unlocked.includes(id))));
        const missingText = missing.length ? ' These cards still need to be in your file and sorted correctly: ' + missing.map((id) => cardById(id).title).join('; ') + '.' : '';
        const flagText = c.needsFlag && !(state.flags && state.flags[c.needsFlag]) ? ' The needed interview statement is still missing.' : '';
        lines.push({ kind: 'claim', text: 'You ruled ' + v + ' on this claim: “' + c.text + '” That is the right answer, but it is not fully backed yet.' + missingText + flagText + ' ' + claimWhy(state, c) });
      }
    });
    // Avoid repeating the same retelling note.
    const noted = new Set();
    Object.entries(state.retell).forEach(([slot, id]) => {
      const o = G.RETELL[slot].options.find((x) => x.id === id);
      if (o && o.tag !== 'owned' && !noted.has(o.tag)) { noted.add(o.tag); lines.push({ kind: 'retell', text: G.RETELL_NOTES[o.tag] }); }
    });
    const special = { nell: 'NELL / THE FIVE', livia: 'THE CARD', wren: 'THE LETTER' }[state.addressee];
    if (special && state.ending === 'THE FIVE') lines.push({ kind: 'address', text: 'You addressed this to someone who could have received a more personal version. The file did not support that account yet, so this ending stays with the evidence you could establish.' });
    if (!lines.length) lines.push({ kind: 'ok', text: 'Everything you ruled on was backed by cards you had classed correctly, and every sentence you chose held up.' });
    return { lines };
  }

  // Progress for the navigation; it does not affect scoring.

  function progress(state) {
    let open = 0;
    for (const [src, iv] of Object.entries(G.INTERVIEWS)) open += iv.topics.filter((t) => topicAvailable(state, src, t).ok).length;
    return {
      cards: state.unlocked.length,
      classified: state.unlocked.filter((id) => state.classes[id]).length,
      asked: state.asked.length,
      openTopics: open,
      claims: G.CLAIMS.length,
      ruled: Object.keys(state.verdicts).length,
      retellChosen: Object.keys(state.retell).length + (state.addressee ? 1 : 0),
      retellTotal: Object.keys(G.RETELL).length + 1,
      timelineDone: !!state.timeline,
      pagesOpen: state.unlocked.includes('x02'),
      pagesDone: !!state.pages,
      pins: state.pins.length,
    };
  }

  // Suggest the next useful action without repeating a screen name.
  function nextStep(state) {
    const pr = progress(state);
    const n = pr.cards - pr.classified;
    if (!pr.asked) return { screen: 'interviews', text: 'Start by talking to someone.' };
    if (n > 0) return { screen: 'evidence', text: 'Sort the remaining unclassified cards.' };
    // Ask the optional questions before the timeline hint appears.
    if (pr.openTopics > 0 && !pr.timelineDone) return { screen: 'interviews', text: 'There is more to ask.' };
    if (!pr.timelineDone) return { screen: 'timeline', text: 'Put the night in order.' };
    if (pr.pagesOpen && !pr.pagesDone) return { screen: 'pages', text: 'Compare the sign-offs.' };
    if (pr.ruled < pr.claims) return { screen: 'verdicts', text: 'Review any claims you have not judged yet.' };
    if (pr.retellChosen < pr.retellTotal) return { screen: 'retell', text: 'Choose your three sentences.' };
    return { screen: 'retell', text: 'Ready to speak.' };
  }

  // save / load

  function save(state, storage) {
    try {
      if (state.lang === 'en' || state.lang === 'ur') storage.setItem(LANG_KEY, state.lang);
      storage.setItem(SAVE_KEY, JSON.stringify(state)); return true;
    } catch (e) { return false; }
  }

  let loadWarning = null;
  const ownObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const allowedScreen = new Set(['title', 'briefing', 'evidence', 'interviews', 'places', 'timeline', 'board', 'pages', 'verdicts', 'retell', 'ending']);

  function allFlags() {
    const out = new Set();
    Object.values(G.INTERVIEWS || {}).forEach((iv) => iv.topics.forEach((t) => Object.keys((t.effects && t.effects.flags) || {}).forEach((x) => out.add(x))));
    G.CARDS.forEach((c) => (c.truthIf || []).forEach((r) => out.add(r.flag)));
    (G.CLAIMS || []).forEach((c) => { (c.correctIf || []).forEach((r) => out.add(r.flag)); (c.whyIf || []).forEach((r) => out.add(r.flag)); });
    return out;
  }

  // Keep valid save fields, reset damaged ones, and leave the stored file untouched until the next save.
  function sanitizeSave(s, storage) {
    const base = newState();
    let damaged = false;
    const bad = () => { damaged = true; };
    if (!ownObject(s)) { loadWarning = 'The saved file could not be read. A fresh, safe state is ready; the stored file was left untouched.'; return null; }
    if (Number.isFinite(s.v) && s.v > SAVE_VERSION) { loadWarning = 'This saved file is from a newer game version. It was left untouched; a safe new state is ready.'; return null; }

    const knownCards = new Set(G.CARDS.map((c) => c.id));
    const starters = G.CARDS.filter((c) => c.start).map((c) => c.id);
    const rawUnlocked = Array.isArray(s.unlocked) ? s.unlocked : (bad(), []);
    const unlocked = [...new Set(rawUnlocked.filter((id) => knownCards.has(id)))];
    if (unlocked.length !== rawUnlocked.length) bad();
    starters.forEach((id) => { if (!unlocked.includes(id)) { unlocked.push(id); bad(); } });
    base.unlocked = unlocked;

    if (!ownObject(s.classes)) bad();
    else Object.entries(s.classes).forEach(([id, cls]) => {
      if (knownCards.has(id) && unlocked.includes(id) && CLASSES.includes(cls)) base.classes[id] = cls;
      else bad();
    });

    const sources = Object.keys(G.START_TRUST || {});
    if (!ownObject(s.trust)) bad();
    else sources.forEach((id) => {
      const n = s.trust[id];
      if (Number.isInteger(n) && n >= 0 && n <= 5) base.trust[id] = n;
      else if (n !== undefined) bad();
    });
    if (ownObject(s.trust)) Object.keys(s.trust).forEach((id) => { if (!sources.includes(id)) bad(); });

    const flagsAllowed = allFlags();
    if (!ownObject(s.flags)) bad();
    else Object.entries(s.flags).forEach(([key, value]) => {
      if (flagsAllowed.has(key) && typeof value === 'boolean') base.flags[key] = value;
      else bad();
    });
    const topicsAllowed = new Set(Object.values(G.INTERVIEWS || {}).flatMap((iv) => iv.topics.map((t) => t.id)));
    const asked = Array.isArray(s.asked) ? s.asked : (bad(), []);
    base.asked = [...new Set(asked.filter((id) => topicsAllowed.has(id)))];
    if (base.asked.length !== asked.length) bad();

    const choice = (value, options) => {
      if (value === null || value === undefined) return null;
      if (options.some((x) => x.id === value)) return value;
      bad(); return null;
    };
    base.timeline = choice(s.timeline, G.TIMELINE.options);
    base.pages = choice(s.pages, G.PAGES.options);
    if (!ownObject(s.verdicts)) bad();
    else Object.entries(s.verdicts).forEach(([id, v]) => {
      if (claimById(id) && VERDICTS.includes(v)) base.verdicts[id] = v;
      else bad();
    });
    if (!ownObject(s.retell)) bad();
    else Object.entries(s.retell).forEach(([slot, id]) => {
      const group = G.RETELL[slot];
      if (group && group.options.some((o) => o.id === id)) base.retell[slot] = id;
      else bad();
    });
    if (s.addressee === null || s.addressee === undefined) base.addressee = null;
    else if (G.ADDRESSEES.some((a) => a.id === s.addressee)) base.addressee = s.addressee;
    else bad();
    if (s.ending === null || s.ending === undefined) base.ending = null;
    else if (G.ENDINGS[s.ending]) base.ending = s.ending;
    else bad();
    if (typeof s.screen === 'string' && allowedScreen.has(s.screen)) base.screen = s.screen;
    else if (s.screen !== undefined) bad();
    if (base.screen === 'ending' && !base.ending) { base.screen = 'retell'; bad(); }

    if (!Array.isArray(s.pins)) bad();
    else s.pins.forEach((pin) => {
      if (typeof pin !== 'string') { bad(); return; }
      const ids = pin.split('|');
      if (ids.length !== 2 || !unlocked.includes(ids[0]) || !unlocked.includes(ids[1]) || !relation(base, ids[0], ids[1])) { bad(); return; }
      const normalized = pairKey(ids[0], ids[1]);
      if (!base.pins.includes(normalized)) base.pins.push(normalized);
    });

    if (s.notes !== undefined) {
      if (typeof s.notes === 'string') { base.notes = s.notes.slice(0, MAX_NOTE_LENGTH); if (s.notes.length > MAX_NOTE_LENGTH) bad(); }
      else bad();
    }
    if (s.openQuestions !== undefined) {
      if (!Array.isArray(s.openQuestions)) bad();
      else {
        const seenQuestions = new Set();
        s.openQuestions.forEach((value) => {
          if (typeof value !== 'string') { bad(); return; }
          const text = value.trim().slice(0, MAX_QUESTION_LENGTH);
          if (!text || text.length !== value.trim().length || seenQuestions.has(text.toLowerCase()) || base.openQuestions.length >= MAX_QUESTIONS) { bad(); return; }
          seenQuestions.add(text.toLowerCase()); base.openQuestions.push(text);
        });
        if (s.openQuestions.length > MAX_QUESTIONS) bad();
      }
    }

    if (s.lang === 'en' || s.lang === 'ur') base.lang = s.lang;
    else if (s.lang !== undefined) bad();
    try {
      const pref = storage && storage.getItem(LANG_KEY);
      if (pref === 'en' || pref === 'ur') base.lang = pref;
    } catch (e) { /* storage may be blocked */ }
    base.v = SAVE_VERSION;
    loadWarning = damaged ? 'The saved file had damaged or outdated parts. A safe version was loaded; invalid values were reset. The stored file will not be changed until you continue.' : null;
    return base;
  }

  function load(storage) {
    loadWarning = null;
    let raw = null;
    try {
      raw = storage.getItem(SAVE_KEY);
      if (!raw) return null;
      const state = sanitizeSave(JSON.parse(raw), storage);
      if (!state && loadWarning) {
        try { storage.setItem(RECOVERY_KEY, raw); } catch (e) { /* original key is still untouched */ }
      }
      return state;
    } catch (e) {
      loadWarning = 'The saved file could not be read. A fresh, safe state is ready; the stored file was left untouched.';
      try { if (raw) storage.setItem(RECOVERY_KEY, raw); } catch (ignored) { /* best effort only */ }
      return null;
    }
  }

  function clearSave(storage) {
    try { storage.removeItem(SAVE_KEY); storage.removeItem(RECOVERY_KEY); return true; } catch (e) { return false; }
  }

  Object.assign(G, {
    CLASSES, VERDICTS, SAVE_KEY, RECOVERY_KEY, LANG_KEY, cardById, claimById, newState, effectiveTruth, classify,
    activeContradictions, topicAvailable, findTopic, ask, answerTimeline, answerPages,
    timelineCorrect, pagesCorrect, setVerdict, claimCorrect, claimWhy, claimStatus, chooseRetell, chooseAddressee,
    retellComplete, score, resolveEnding, endingBody, explainEnding, coreSupported, save, load, clearSave,
    setNotes, addOpenQuestion, removeOpenQuestion, MAX_NOTE_LENGTH, MAX_QUESTIONS, MAX_QUESTION_LENGTH,
    pairKey, relation, knownRelations, togglePin, progress, nextStep,
  });
  Object.defineProperty(G, 'loadWarning', { configurable: true, get: () => loadWarning });
})(typeof window !== 'undefined' ? window : globalThis);
