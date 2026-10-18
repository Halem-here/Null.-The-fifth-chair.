// Run: node tests/run.js
// Uses the game engine and data, with an in-memory localStorage.
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const root = path.join(__dirname, '..', 'js');
['data-facts', 'data-cards', 'data-interviews', 'data-story', 'data-links', 'engine', 'art', 'data-locale', 'i18n'].forEach((f) => require(path.join(root, f + '.js')));
const G = globalThis.NULLGAME;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}

// helpers
const memStore = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, _m: m }; };
function askSeq(s, src, ids) { ids.forEach((id) => { const r = G.ask(s, src, id); assert(r.ok, `ask ${src}/${id} failed: ${r.reason}`); }); }

// Prepare a full investigation for verdict and ending tests.
function investigate(opts = {}) {
  const s = G.newState();
  askSeq(s, 'dess', ['dess-what', 'dess-when', 'dess-safe', 'dess-vote', 'dess-sheet', 'dess-rope', 'dess-nell']);
  askSeq(s, 'corin', ['corin-dock', 'corin-rope', 'corin-source', 'corin-log', 'corin-sheet']);
  askSeq(s, 'teo', ['teo-beach', 'teo-rope', 'teo-drink', 'teo-photo', 'teo-up']);
  askSeq(s, 'wren', ['wren-last', 'wren-sign', 'wren-where', 'wren-meta']);
  if (opts.wrenTell !== false) askSeq(s, 'wren', ['wren-tell']);
  askSeq(s, 'livia', ['livia-rescue', 'livia-door', 'livia-number']);
  if (!opts.pressLivia) {
    askSeq(s, 'livia', ['livia-carry', 'livia-before', 'livia-sign-hi']);
  } else {
    askSeq(s, 'livia', ['livia-press', 'livia-sign-lo', 'livia-carry', 'livia-before']);
  }
  return s;
}
function classifyIdeal(s) {
  s.unlocked.forEach((id) => assert(G.classify(s, id, G.effectiveTruth(G.cardById(id), s)).ok));
}
function verdictsIdeal(s) { G.CLAIMS.forEach((c) => G.setVerdict(s, c.id, G.claimCorrect(s, c))); }
function retell(s, a, b, c, who) {
  G.chooseRetell(s, 'A', a); G.chooseRetell(s, 'B', b); G.chooseRetell(s, 'C', c); G.chooseAddressee(s, who);
}
function fullSolve(who, opts) {
  const s = investigate(opts);
  classifyIdeal(s);
  assert(G.answerTimeline(s, 'tl-b').correct);
  assert.strictEqual(G.answerPages(s, 'pg-c').result, 'correct');
  verdictsIdeal(s);
  retell(s, 'A3', 'B2', 'C1', who);
  return s;
}

// data integrity
console.log('Data integrity');
test('card ids are unique', () => {
  const ids = G.CARDS.map((c) => c.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});
test('every card has a valid source and truth', () => {
  G.CARDS.forEach((c) => { assert(G.SOURCES[c.source], c.id + ' source'); assert(G.CLASSES.includes(c.truth), c.id + ' truth'); assert(c.weight > 0, c.id + ' weight'); });
});
test('every non-start card is unlocked by some interview topic', () => {
  const unlockable = new Set();
  Object.values(G.INTERVIEWS).forEach((iv) => iv.topics.forEach((t) => ((t.effects || {}).unlock || []).forEach((id) => unlockable.add(id))));
  G.CARDS.filter((c) => !c.start).forEach((c) => assert(unlockable.has(c.id), c.id + ' can never be unlocked'));
});
test('every topic unlock, requirement and contradiction refers to a real card', () => {
  Object.values(G.INTERVIEWS).forEach((iv) => iv.topics.forEach((t) => {
    ((t.effects || {}).unlock || []).forEach((id) => assert(G.cardById(id), t.id + ' unlocks missing ' + id));
    if (t.requires && t.requires.card) assert(G.cardById(t.requires.card), t.id + ' requires missing card');
  }));
  G.CONTRADICTIONS.forEach((p) => { assert(G.cardById(p.a) && G.cardById(p.b), 'contradiction ' + p.a + '/' + p.b); });
  G.CLAIMS.forEach((c) => c.needs.forEach((id) => assert(G.cardById(id), c.id + ' needs missing ' + id)));
  G.TIMELINE.events.forEach((e) => assert(G.cardById(e.card), 'timeline card ' + e.card));
});
test('every flag a topic requires is set by some topic', () => {
  const set = new Set();
  Object.values(G.INTERVIEWS).forEach((iv) => iv.topics.forEach((t) => Object.keys((t.effects || {}).flags || {}).forEach((f) => set.add(f))));
  Object.values(G.INTERVIEWS).forEach((iv) => iv.topics.forEach((t) => { if (t.requires && t.requires.flag) assert(set.has(t.requires.flag), t.id + ' needs unset flag ' + t.requires.flag); }));
  G.CARDS.forEach((c) => (c.truthIf || []).forEach((r) => assert(set.has(r.flag), c.id + ' truthIf flag ' + r.flag + ' never set')));
});
test('every topic can be asked in some legal order (full interview closure)', () => {
  // Ask every available topic except Livia’s low-trust and press branches.
  const skip = new Set(['livia-press', 'livia-sign-lo']);
  const s = G.newState();
  let progress = true;
  while (progress) {
    progress = false;
    for (const [src, iv] of Object.entries(G.INTERVIEWS)) {
      for (const t of iv.topics) {
        if (skip.has(t.id)) continue;
        if (G.ask(s, src, t.id).ok) progress = true;
      }
    }
  }
  Object.values(G.INTERVIEWS).forEach((iv) => iv.topics.forEach((t) => {
    if (!skip.has(t.id)) assert(s.asked.includes(t.id), t.id + ' unreachable');
  }));
});
test('exactly one timeline option is correct; one pages option is correct', () => {
  assert.strictEqual(G.TIMELINE.options.filter((o) => o.correct).length, 1);
  assert.strictEqual(G.PAGES.options.filter((o) => o.result === 'correct').length, 1);
});
test('the timeline gap is 2h20m, matching the brief', () => {
  const o = G.TIMELINE.options.find((x) => x.correct);
  const m = (t) => { const [h, mi] = t.split(':').map(Number); return h * 60 + mi; };
  let gap = m(o.to) - m(o.from); if (gap < 0) gap += 1440;
  assert.strictEqual(gap, 140);
});
test('all seven endings have text', () => {
  ['STRUCK', 'THE SAME SENTENCE', 'NO ANSWER', 'THE FIVE', 'THE LETTER', 'THE CARD', 'NELL / THE FIVE'].forEach((e) => {
    assert(G.ENDINGS[e] && G.ENDINGS[e].body.length >= 3, e);
  });
});
test('sign-off data keeps "-- N." for Nell and "-- N" for the copy', () => {
  G.PAGES.samples.forEach((s) => assert.strictEqual(s.sign, s.copied ? '-- N' : '-- N.'));
});
test('the chair motif means Nell’s empty fifth place, never a sixth chair for Arlo', () => {
  const text = Object.values(G.ENDINGS).flatMap(e => e.body.map(b => typeof b === 'string' ? b : b.t)).join(' ');
  assert(/Nell’s place by the window is empty/.test(G.INTRO.join(' ')));
  assert(!/counts a sixth|sets six chairs|sixth chair/i.test(text));
  assert(/untied the rope/.test(text));
});
test('the signature line appears only on Nell’s page and in the closing ending', () => {
  const line = 'I’d like one of you to say it happened';
  const hits = [];
  G.CARDS.forEach((c) => { if (c.text.includes(line)) hits.push(c.id); });
  assert.deepStrictEqual(hits, ['n01']);
});

// engine behaviour
console.log('Engine');
test('clean state starts with only start cards, default trust, no flags', () => {
  const s = G.newState();
  assert.deepStrictEqual(s.unlocked.sort(), G.CARDS.filter((c) => c.start).map((c) => c.id).sort());
  assert.deepStrictEqual(s.trust, G.START_TRUST);
  assert.deepStrictEqual(s.flags, {});
  assert.strictEqual(s.ending, null);
});
test('newState does not share trust object with the constants', () => {
  const s = G.newState(); s.trust.dess = 0;
  assert.strictEqual(G.START_TRUST.dess, 3);
});
test('invalid actions are rejected and leave state unchanged', () => {
  const s = G.newState(); const before = JSON.stringify(s);
  assert(!G.classify(s, 'nope', 'fact').ok);
  assert(!G.classify(s, 'x03', 'fact').ok, 'locked card');
  assert(!G.classify(s, 'c01', 'maybe').ok);
  assert(!G.ask(s, 'dess', 'nope').ok);
  assert(!G.ask(s, 'nobody', 'dess-what').ok);
  assert(!G.ask(s, 'dess', 'dess-safe').ok, 'gated topic');
  assert(!G.setVerdict(s, 'k1', 'MAYBE').ok);
  assert(!G.setVerdict(s, 'zz', 'TRUE').ok);
  assert(!G.chooseRetell(s, 'A', 'B1').ok);
  assert(!G.chooseAddressee(s, 'bob').ok);
  assert(!G.answerTimeline(s, 'zz').ok);
  assert.strictEqual(JSON.stringify(s), before);
});
test('a topic can only be asked once', () => {
  const s = G.newState();
  assert(G.ask(s, 'teo', 'teo-drink').ok);
  assert(!G.ask(s, 'teo', 'teo-drink').ok);
  assert.strictEqual(s.trust.teo, 4);
});
test('trust is clamped to 0..5', () => {
  const s = G.newState(); s.trust.livia = 0;
  G.ask(s, 'livia', 'livia-press');
  assert.strictEqual(s.trust.livia, 0);
  s.trust.teo = 5; G.ask(s, 'teo', 'teo-drink');
  assert.strictEqual(s.trust.teo, 5);
});
test('pressing Dess on the signal costs trust and sets the follow-up flag', () => {
  const s = G.newState();
  G.ask(s, 'dess', 'dess-when');
  assert.strictEqual(s.trust.dess, 2);
  assert(s.flags.askedSignal);
  assert(G.ask(s, 'dess', 'dess-safe').ok);
});
test('Livia: low trust shows the deflection, high trust produces the SIM', () => {
  const lo = G.newState(); G.ask(lo, 'wren', 'wren-last'); G.ask(lo, 'wren', 'wren-sign');
  const t = (s, id) => G.topicAvailable(s, 'livia', G.findTopic('livia', id)).ok;
  assert(t(lo, 'livia-sign-lo') && !t(lo, 'livia-sign-hi'));
  G.ask(lo, 'livia', 'livia-carry'); G.ask(lo, 'livia', 'livia-before');
  assert(!t(lo, 'livia-sign-lo') && t(lo, 'livia-sign-hi'));
  G.ask(lo, 'livia', 'livia-sign-hi');
  assert(lo.flags.simFound && lo.unlocked.includes('x03'));
});
test('effective truth flips for l03 and x01 once the SIM is found', () => {
  const s = G.newState();
  assert.strictEqual(G.effectiveTruth(G.cardById('l03'), s), 'told');
  s.flags.simFound = true; s.flags.copiedProved = true;
  assert.strictEqual(G.effectiveTruth(G.cardById('l03'), s), 'struck');
  assert.strictEqual(G.effectiveTruth(G.cardById('x01'), s), 'struck');
});
test('the call log does not disprove Dess’s “when we could” account; it only leaves timing uncertain', () => {
  const s = G.newState(); G.ask(s, 'dess', 'dess-what');
  assert.strictEqual(G.cardById('d01').truth, 'told');
  assert(!G.activeContradictions(s).some((p) => (p.a === 'd01' && p.b === 'c03') || (p.a === 'c03' && p.b === 'd01')));
  assert.strictEqual(G.relation(s, 'd01', 'c03').status, 'uncertain');
});
test('striking a Guessed card still counts as a wrong strike (unproven is not false)', () => {
  const s = G.newState(); G.classify(s, 'b01', 'struck');
  assert.strictEqual(G.score(s).strikeWrong, 1);
});
test('striking the anonymous forum post is a wrong strike: a rumour is Guessed, not disproved', () => {
  const s = G.newState(); G.classify(s, 'c06', 'struck');
  assert.strictEqual(G.cardById('c06').truth, 'guessed');
  assert.strictEqual(G.score(s).strikeWrong, 1);
});
test('a correct TRUE/FALSE verdict is "unbacked" until its cards are classed Fact', () => {
  const s = G.newState(); G.setVerdict(s, 'k1', 'TRUE');
  assert.strictEqual(G.claimStatus(s, G.claimById('k1')), 'unbacked');
  G.classify(s, 'c05', 'fact'); assert.strictEqual(G.claimStatus(s, G.claimById('k1')), 'unbacked', 'needs the photograph too');
  G.classify(s, 'c01', 'fact');
  assert.strictEqual(G.claimStatus(s, G.claimById('k1')), 'supported');
  G.setVerdict(s, 'k1', 'FALSE');
  assert.strictEqual(G.claimStatus(s, G.claimById('k1')), 'wrong');
});
test('NULL is supported for claims the file cannot establish, without demanding unrelated cards', () => {
  const s = G.newState();
  G.setVerdict(s, 'k4', 'NULL'); G.setVerdict(s, 'k3', 'NULL');
  assert.strictEqual(G.claimStatus(s, G.claimById('k4')), 'supported');
  assert.strictEqual(G.claimStatus(s, G.claimById('k3')), 'supported');
  G.setVerdict(s, 'k1', 'NULL');
  assert.strictEqual(G.claimStatus(s, G.claimById('k1')), 'wrong');
});
test('timeline and signature puzzles can be retried and keep the latest answer', () => {
  const s = G.newState();
  assert(!G.answerTimeline(s, 'tl-a').correct);
  assert(G.answerTimeline(s, 'tl-b').correct);
  assert.strictEqual(s.timeline, 'tl-b');
  assert.strictEqual(G.answerPages(s, 'pg-b').result, 'accuse');
  assert.strictEqual(G.answerPages(s, 'pg-c').result, 'correct');
  assert.strictEqual(s.pages, 'pg-c');
});
test('ending cannot resolve until the retelling and addressee are complete', () => {
  const s = G.newState();
  assert(!G.resolveEnding(s).ok);
  G.chooseRetell(s, 'A', 'A3'); G.chooseRetell(s, 'B', 'B2'); G.chooseRetell(s, 'C', 'C1');
  assert(!G.resolveEnding(s).ok, 'still no addressee');
  assert.strictEqual(s.ending, null);
});

// all seven endings
console.log('Endings');
test('THE FIVE: correct and responsible, addressed to the table', () => {
  const s = fullSolve('five'); assert.strictEqual(G.resolveEnding(s).ending, 'THE FIVE');
});
test('THE LETTER: addressed to Wren with her trust earned', () => {
  const s = fullSolve('wren'); assert.strictEqual(G.resolveEnding(s).ending, 'THE LETTER');
});
test('THE CARD: addressed to Livia once the SIM was earned', () => {
  const s = fullSolve('livia'); assert.strictEqual(G.resolveEnding(s).ending, 'THE CARD');
});
test('NELL / THE FIVE: addressed to Nell with everything established', () => {
  const s = fullSolve('nell'); assert.strictEqual(G.resolveEnding(s).ending, 'NELL / THE FIVE');
});
test('STRUCK: destroying three solid records', () => {
  const s = fullSolve('five');
  ['c01', 'c02', 'c03'].forEach((id) => G.classify(s, id, 'struck'));
  assert.strictEqual(G.resolveEnding(s).ending, 'STRUCK');
});
test('STRUCK outranks the group’s sentence', () => {
  const s = fullSolve('five'); ['c01', 'c02', 'c03'].forEach((id) => G.classify(s, id, 'struck'));
  retell(s, 'A1', 'B1', 'C1', 'five');
  assert.strictEqual(G.resolveEnding(s).ending, 'STRUCK');
});
test('THE SAME SENTENCE: repeating the agreed line even with perfect evidence work', () => {
  const s = fullSolve('five'); retell(s, 'A1', 'B1', 'C1', 'five');
  assert.strictEqual(G.resolveEnding(s).ending, 'THE SAME SENTENCE');
});
test('NO ANSWER: judging everything NULL and hedging in the retelling', () => {
  const s = G.newState(); G.CLAIMS.forEach((c) => G.setVerdict(s, c.id, 'NULL'));
  retell(s, 'A2', 'B3', 'C3', 'five');
  assert.strictEqual(G.resolveEnding(s).ending, 'NO ANSWER');
});
test('NO ANSWER: overclaiming in the retelling (accusing, declaring Nell dead) also fails', () => {
  const s = fullSolve('five'); retell(s, 'A4', 'B2', 'C2', 'five');
  assert.strictEqual(G.resolveEnding(s).ending, 'NO ANSWER');
});
test('NO ANSWER: the right retelling with no evidence behind it', () => {
  const s = G.newState(); retell(s, 'A3', 'B2', 'C1', 'five');
  assert.strictEqual(G.resolveEnding(s).ending, 'NO ANSWER');
});

// special-ending gates
console.log('Gates');
test('addressing Nell without Wren’s forwarded metadata falls back to THE FIVE', () => {
  const s = fullSolve('nell'); s.flags.wrenForwarded = false;
  assert.strictEqual(G.resolveEnding(s).ending, 'THE FIVE');
});
test('addressing Nell after declaring her dead falls back to NO ANSWER (support count drops)', () => {
  const s = fullSolve('nell'); G.setVerdict(s, 'k9', 'TRUE'); G.setVerdict(s, 'k8', 'TRUE');
  assert.notStrictEqual(G.resolveEnding(s).ending, 'NELL / THE FIVE');
});
test('addressing Nell with the timeline wrong falls back to THE FIVE', () => {
  const s = investigate(); classifyIdeal(s);
  G.answerTimeline(s, 'tl-a'); G.answerPages(s, 'pg-c'); verdictsIdeal(s);
  retell(s, 'A3', 'B2', 'C1', 'nell');
  assert.strictEqual(G.resolveEnding(s).ending, 'THE FIVE');
});
test('pressing Livia early lowers trust but gentle follow-ups restore the SIM route', () => {
  const s = investigate({ pressLivia: true });
  assert(!s.flags.simFound && s.flags.liviaDeflected);
  assert.strictEqual(s.trust.livia, 2);
  assert(G.topicAvailable(s, 'livia', G.findTopic('livia', 'livia-sign-hi')).ok);
  assert(G.ask(s, 'livia', 'livia-sign-hi').ok);
  assert(s.flags.simFound && s.unlocked.includes('x03'));
});
test('THE CARD does not require the pages puzzle or an unrelated rope verdict', () => {
  const s = fullSolve('livia'); G.answerPages(s, 'pg-b'); G.setVerdict(s, 'k5', null);
  assert.strictEqual(G.resolveEnding(s).ending, 'THE CARD');
});
test('THE LETTER needs Wren’s trust; without her follow-up it falls back to THE FIVE', () => {
  const s = fullSolve('wren'); s.trust.wren = 3;
  assert.strictEqual(G.resolveEnding(s).ending, 'THE FIVE');
});
test('the ideal route has zero wrong strikes, backs all eight core claims and supports all ten total', () => {
  const s = fullSolve('five'); const sc = G.score(s);
  assert.strictEqual(sc.strikeWrong, 0); assert.strictEqual(sc.supported, 10);
});


// evidence board
console.log('Evidence board');
const unlockAll = (s) => { G.CARDS.forEach((c) => { if (!s.unlocked.includes(c.id)) s.unlocked.push(c.id); }); return s; };
test('every link and contradiction names real cards, with no duplicate pairs', () => {
  const seen = new Set();
  [...G.CONTRADICTIONS, ...G.LINKS].forEach((x) => {
    assert(G.cardById(x.a) && G.cardById(x.b), `${x.a}/${x.b} must exist`);
    assert(x.why && x.why.length > 10, `${x.a}/${x.b} needs a reason`);
    const k = G.pairKey(x.a, x.b); assert(!seen.has(k), 'duplicate pair ' + k); seen.add(k);
  });
  G.LINKS.forEach((l) => assert(['supports', 'consistent', 'uncertain'].includes(l.kind), l.a + ' kind'));
});
test('a relation needs both cards to be in the file', () => {
  const s = G.newState();
  assert.strictEqual(G.relation(s, 'c02', 'c03').status, 'uncertain');   // both start in the file
  assert.strictEqual(G.relation(s, 'c02', 'd02'), null);          // d02 not unlocked yet
  assert.strictEqual(G.relation(s, 'c02', 'c02'), null);
  assert.strictEqual(G.relation(s, 'c02', 'c12'), null);          // both in file, nothing recorded
});
test('Dess’s timing account stays uncertain beside the call log, not DISPUTED', () => {
  const s = unlockAll(G.newState());
  assert.strictEqual(G.relation(s, 'd01', 'c03').status, 'uncertain');
  assert.strictEqual(G.relation(s, 'c03', 'd01').status, 'uncertain');
});
test('a supporting link is UNCERTAIN until both cards are classed Fact', () => {
  const s = unlockAll(G.newState());
  assert.strictEqual(G.relation(s, 'c02', 'c03').status, 'uncertain');
  G.classify(s, 'c02', 'fact'); assert.strictEqual(G.relation(s, 'c02', 'c03').status, 'uncertain');
  G.classify(s, 'c03', 'fact'); assert.strictEqual(G.relation(s, 'c02', 'c03').status, 'supported');
  G.classify(s, 'c03', 'told'); assert.strictEqual(G.relation(s, 'c02', 'c03').status, 'uncertain');
});
test('consistent and uncertain links never become SUPPORTED, even when both are Fact', () => {
  const s = unlockAll(G.newState());
  G.LINKS.filter((l) => l.kind !== 'supports').forEach((l) => { G.classify(s, l.a, 'fact'); G.classify(s, l.b, 'fact'); assert.strictEqual(G.relation(s, l.a, l.b).status, 'uncertain', l.a + l.b); });
});
test('the board gives nothing away: no relation is SUPPORTED or RESOLVED on a fresh file', () => {
  const s = unlockAll(G.newState());
  G.knownRelations(s).forEach((r) => assert(['disputed', 'uncertain'].includes(r.status), r.a + r.b + r.status));
});
test('pinning records a connection, toggles, and refuses pairs the file does not connect', () => {
  const s = unlockAll(G.newState());
  assert.deepStrictEqual(G.togglePin(s, 'c02', 'c03'), { ok: true, pinned: true });
  assert.deepStrictEqual(s.pins, ['c02|c03']);
  assert.strictEqual(G.togglePin(s, 'c03', 'c02').pinned, false);   // reversed order is the same pin
  assert.deepStrictEqual(s.pins, []);
  assert.strictEqual(G.togglePin(s, 'c02', 'c12').ok, false);
  assert.strictEqual(G.togglePin(G.newState(), 'c02', 'c03').pinned, true);
});
test('pins and board use never change the score or the ending', () => {
  const a = fullSolve('nell'), b = fullSolve('nell');
  unlockAll(b); b.pins = []; G.knownRelations(b).forEach((r) => G.togglePin(b, r.a, r.b));
  assert(b.pins.length > 5);
  assert.deepStrictEqual(G.score(a), G.score(b));
  assert.strictEqual(G.resolveEnding(a).ending, 'NELL / THE FIVE'); assert.strictEqual(G.resolveEnding(b).ending, 'NELL / THE FIVE');
});
test('pins survive save and load, and an older save without pins still loads', () => {
  const st = memStore(); const s = unlockAll(G.newState()); G.togglePin(s, 'c02', 'c03'); G.save(s, st);
  assert.deepStrictEqual(G.load(st).pins, ['c02|c03']);
  const old = G.newState(); delete old.pins; st.setItem(G.SAVE_KEY, JSON.stringify(old));
  assert.deepStrictEqual(G.load(st).pins, []);
});

// progress and the next-step hint
console.log('Progress');
test('progress counts what the player has actually done', () => {
  const s = G.newState(); let pr = G.progress(s);
  assert.strictEqual(pr.asked, 0); assert.strictEqual(pr.classified, 0); assert.strictEqual(pr.ruled, 0);
  G.ask(s, 'dess', 'dess-what'); G.classify(s, 'c01', 'fact'); G.setVerdict(s, 'k1', 'TRUE');
  pr = G.progress(s); assert.strictEqual(pr.asked, 1); assert.strictEqual(pr.classified, 1); assert.strictEqual(pr.ruled, 1);
  assert.strictEqual(pr.cards, s.unlocked.length); assert.strictEqual(pr.claims, G.CLAIMS.length);
});
test('the next-step hint follows the game and always points at a real screen', () => {
  const screens = ['evidence', 'interviews', 'timeline', 'pages', 'verdicts', 'retell'];
  const s = G.newState();
  assert.strictEqual(G.nextStep(s).screen, 'interviews');
  G.ask(s, 'dess', 'dess-what'); assert.strictEqual(G.nextStep(s).screen, 'evidence');
  classifyIdeal(s); assert.strictEqual(G.nextStep(s).screen, 'interviews');
  const full = fullSolve('five'); assert.strictEqual(G.nextStep(full).text, 'Ready to speak.');
  [s, full, investigate()].forEach((x) => assert(screens.includes(G.nextStep(x).screen)));
});
test('hint wording avoids the names of screens, so no button duplicates a nav label', () => {
  const banned = ['evidence', 'interviews', 'timeline', 'pages', 'verdicts', 'retelling', 'say it', 'begin', 'continue', 'new game', 'cancel', 'open the file', 'start again'];
  const s = G.newState(); const texts = [];
  texts.push(G.nextStep(s).text); G.ask(s, 'dess', 'dess-what'); texts.push(G.nextStep(s).text); classifyIdeal(s); texts.push(G.nextStep(s).text);
  const inv = investigate(); texts.push(G.nextStep(inv).text); classifyIdeal(inv); texts.push(G.nextStep(inv).text); G.answerTimeline(inv, 'tl-b'); texts.push(G.nextStep(inv).text);
  G.answerPages(inv, 'pg-c'); texts.push(G.nextStep(inv).text); verdictsIdeal(inv); texts.push(G.nextStep(inv).text); retell(inv, 'A3', 'B2', 'C1', 'five'); texts.push(G.nextStep(inv).text);
  texts.forEach((t) => banned.forEach((b) => assert(!t.toLowerCase().includes(b), `"${t}" contains "${b}"`)));
});

// presentation data
console.log('Presentation');
const ROOT = path.join(__dirname, '..');
test('every card has a look, a label, a when and an origin', () => {
  G.CARDS.forEach((c) => { const m = G.ART.cardMeta(c); assert(m.kind && m.label && m.when && m.origin, c.id); assert(['record', 'account'].includes(m.from), c.id + ' from'); });
});
test('every image the game points at exists on disk and is a well-formed SVG', () => {
  const imgs = G.ART.allImages(); assert(imgs.length >= 23, 'found ' + imgs.length);
  imgs.forEach((i) => {
    assert(!/^(https?:)?\/\//.test(i), i + ' must be local');
    assert(!i.startsWith('/'), i + ' must be relative so Netlify subpaths and file:// both work');
    const f = path.join(ROOT, i); assert(fs.existsSync(f), 'missing ' + i);
    const t = fs.readFileSync(f, 'utf8'); assert(t.startsWith('<svg') && t.trimEnd().endsWith('</svg>'), i + ' not an svg'); assert(!/https?:\/\/(?!www\.w3\.org)/.test(t), i + ' links out');
  });
  assert(fs.existsSync(path.join(ROOT, 'assets/places/house.svg')));
});
test('photo cards point at an image and say what is in it', () => {
  G.CARDS.map((c) => G.ART.cardMeta(c)).filter((m) => m.kind === 'photo' || m.kind === 'sim').forEach((m) => { assert(m.img && m.alt && m.alt.length > 15, m.id); });
});
test('the 20:41 photo and the 01:15 frame say what the cards say, no more', () => {
  const alt1 = G.ART.cardMeta(G.cardById('c01')).alt, alt11 = G.ART.cardMeta(G.cardById('c11')).alt;
  assert(/MIST/.test(alt1) && !/ARLO/.test(alt1) && /one person is on the hull/i.test(alt1));
  assert(/no boat and no person/i.test(alt11));
  const svg11 = fs.readFileSync(path.join(ROOT, 'assets/evidence/cam-c11.svg'), 'utf8'); assert(svg11.includes('01:15'));
  assert(fs.readFileSync(path.join(ROOT, 'assets/evidence/photo-c01.svg'), 'utf8').includes('20:41'));
});
test('every interviewee, place, claim and ending has its presentation', () => {
  Object.keys(G.INTERVIEWS).forEach((id) => assert(G.ART.PEOPLE[id], 'person ' + id));
  Object.values(G.SOURCES).forEach((s, i) => assert(s.name));
  G.ART.PLACES.forEach((pl) => { assert(pl.text.length > 40 && pl.alt); pl.cards.forEach((id) => assert(G.cardById(id), pl.id + ' ' + id)); pl.people.forEach((id) => assert(G.ART.PEOPLE[id])); });
  G.CLAIMS.forEach((c) => { const ids = G.ART.CLAIM_CARDS[c.id]; assert(ids && ids.length, c.id); ids.forEach((id) => assert(G.cardById(id))); (c.needs || []).forEach((n) => assert(ids.includes(n), c.id + ' must list its own backing card ' + n)); });
  Object.keys(G.ENDINGS).forEach((e) => { assert(G.ART.ENDINGS[e], 'ending art ' + e); assert(G.ART.ENDINGS[e].kicker); });
  assert.strictEqual(new Set(Object.values(G.ART.ENDINGS).map((e) => e.img)).size, 7, 'each ending has its own picture');
});
test('Roman Urdu catalog covers every player-facing story, evidence, clue and ending string', () => {
  const strings = [], add = (v) => { if (typeof v === 'string') strings.push(v); };
  G.INTRO.forEach(add); G.HOW_TO.forEach(add); Object.values(G.RULES).forEach(add);
  Object.values(G.SOURCES || {}).forEach((s) => add(s.name));
  G.CARDS.forEach((c) => ['title', 'text'].forEach((k) => add(c[k])));
  Object.values(G.INTERVIEWS).forEach((iv) => { add(iv.name); add(iv.intro); iv.topics.forEach((t) => { add(t.label); (t.lines || []).forEach(add); }); });
  G.CLAIMS.forEach((c) => { add(c.text); add(c.why); (c.whyIf || []).forEach((x) => add(x.text)); });
  Object.values(G.RETELL).forEach((g) => { add(g.title); g.options.forEach((o) => add(o.text)); });
  Object.values(G.RETELL_NOTES).forEach(add); G.ADDRESSEES.forEach((x) => add(x.label));
  Object.values(G.ENDINGS).forEach((e) => { add(e.title); e.body.forEach((b) => add(typeof b === 'string' ? b : b.t)); });
  G.PAGES.samples.forEach((x) => add(x.label)); add(G.PAGES.question); G.PAGES.options.forEach((x) => add(x.label)); Object.values(G.PAGES.feedback).forEach(add);
  G.TIMELINE.options.forEach((x) => add(x.label)); add(G.TIMELINE.note2015); G.TIMELINE.events.forEach((x) => add(x.label));
  Object.values(G.ART.PEOPLE).forEach((x) => ['name', 'tag', 'alt'].forEach((k) => add(x[k])));
  Object.values(G.ART.SOURCE_LABEL).forEach(add); Object.values(G.ART.CLASS_MEANING).forEach(add);
  Object.values(G.ART.NOTES).forEach((x) => { add(x.shows); add(x.limit); });
  G.ART.PLACES.forEach((x) => ['name', 'text', 'alt'].forEach((k) => add(x[k])));
  Object.values(G.ART.ENDINGS).forEach((x) => ['kicker', 'alt'].forEach((k) => add(x[k])));
  Object.values(G.ART.CARDS).forEach((x) => ['label', 'origin', 'alt', 'meta', 'head', 'user', 'when'].forEach((k) => Array.isArray(x[k]) ? x[k].forEach(add) : add(x[k])));
  G.LINKS.forEach((x) => add(x.why)); G.CONTRADICTIONS.forEach((x) => add(x.why));
  G.setLanguage('ur'); G.clearTranslationMisses(); strings.forEach((s) => G.t(s));
  const missing = [...G.translationMisses]; G.setLanguage('en'); G.clearTranslationMisses();
  assert.deepStrictEqual(missing, [], 'Missing Roman Urdu keys: ' + missing.join(' | '));
});
test('Roman Urdu translates live templates and dynamic ending explanations in Latin script', () => {
  const catalog = globalThis.NULL_UR;
  const roman = Object.values(catalog.entries).concat(catalog.patterns.map((p) => p.translationTemplate || '')).join('\n');
  assert(!/[\u0900-\u097F]/.test(roman), 'the locale must not contain Devanagari text');
  G.setLanguage('ur'); G.clearTranslationMisses();
  assert.strictEqual(G.t('You have reached an ending: STRUCK.'), 'Aap is anjaam tak pohanch gaye: STRUCK.');
  assert.strictEqual(G.t('How the file read your answers (6 of 10 claims backed)'), 'File ne aap ke jawabaat ko kaise samjha (10 mein se 6 dawon ko saboot ki himayat hasil)');
  assert(G.t('Ready to speak.').includes('tayyar'));
  const strike = G.t('You struck out 7 cards that nothing in the file disproves: Photograph, 20:41; Message to Mrs Penn, 21:52. Strike a card only when a Fact contradicts it. If you simply cannot check it, mark it Told or Guessed.');
  assert(strike.includes('Mansookh') && !strike.includes('Strike a card only'));
  assert.strictEqual(G.translationMisses.size, 0, 'dynamic text missed: ' + [...G.translationMisses].join(' | '));
  G.setLanguage('en'); G.clearTranslationMisses();
});
test('place and claim card lists do not give a verdict away', () => {
  const nullClaims = G.CLAIMS.filter((c) => c.correct === 'NULL'), tf = G.CLAIMS.filter((c) => c.correct !== 'NULL');
  nullClaims.forEach((c) => assert(G.ART.CLAIM_CARDS[c.id].length >= 2, c.id + ' should list cards to weigh, like the others'));
  tf.forEach((c) => assert(G.ART.CLAIM_CARDS[c.id].length >= 2, c.id));
});
test('vote sheet parses into five votes that match the card', () => {
  const t = G.cardById('c12').text; const votes = [...t.matchAll(/\b(Dess|Corin|Teo|Livia|Nell) (TRUE|FALSE|NULL)\b/g)];
  assert.strictEqual(votes.length, 5);
});


// timeline
console.log('Timeline');
const allText = () => {
  const out = [];
  const walk = (v, where) => { if (typeof v === 'string') out.push([where, v]); else if (Array.isArray(v)) v.forEach((x, i) => walk(x, where)); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { if (k !== 'img' && k !== 'id' && k !== 'tag') walk(x, where + '.' + k); }); };
  walk(G.CARDS, 'cards'); walk(G.CONTRADICTIONS, 'contradictions'); walk(G.LINKS, 'links'); walk(G.INTERVIEWS, 'interviews');
  walk(G.CLAIMS, 'claims'); walk(G.RETELL, 'retell'); walk(G.RETELL_NOTES, 'retellNotes'); walk(G.ENDINGS, 'endings'); walk(G.INTRO, 'intro');
  walk(G.TIMELINE, 'timeline'); walk(G.PAGES, 'pages'); walk(G.ART.NOTES, 'notes'); walk(G.ART.PLACES, 'places'); walk(G.ART.PEOPLE, 'people'); walk(G.ART.CARDS, 'artcards');
  return out;
};
test('21:52 to 22:40 is exactly 48 minutes, and the facts file agrees', () => {
  assert.strictEqual(G.FACTS.between('21:52', '22:40'), 48);
  assert.strictEqual(G.FACTS.delayMinutes, 48);
  assert.strictEqual(G.FACTS.t2015.allSafe, '21:52'); assert.strictEqual(G.FACTS.t2015.firstCall, '22:40');
});
test('the midnight wrap is handled: 22:55 to 01:15 is 2h20m', () => { assert.strictEqual(G.FACTS.unobservedMinutes, 140); });
test('the cards carry exactly the established times', () => {
  const T = G.FACTS;
  assert(G.cardById('c01').text.includes(T.t2015.photo) || G.cardById('c01').title.includes(T.t2015.photo));
  assert(G.cardById('c02').title.includes('21:52') && G.cardById('c02').text.includes('21:52'));
  assert(G.cardById('c03').text.includes('22:40'));
  assert(G.cardById('c08').text.includes('22:55'));
  assert(G.cardById('l02').title.includes('00:10')); assert(G.cardById('t03').title.includes('00:40'));
  assert(G.cardById('c11').text.includes('01:15'));
});
test('no text states the unsupported shore-arrival time or a 75-minute delay', () => {
  allText().forEach(([where, t]) => G.FACTS.unsupportedTimes.forEach((bad) => assert(!t.toLowerCase().includes(bad.toLowerCase()), `${where}: "${bad}" in "${t.slice(0, 80)}"`)));
});
test('no durations in the text other than 48 minutes (or the 2h20m gap) are stated', () => {
  allText().forEach(([where, t]) => { [...t.matchAll(/\b(\d+) minutes\b/g)].forEach((m) => assert(['48', '20'].includes(m[1]), `${where}: "${m[0]}"`)); });
});
test('every clock time in the text is one the facts file knows, or a clearly vague one', () => {
  const known = new Set([...Object.values(G.FACTS.t2015), ...Object.values(G.FACTS.t2016), '18:26', '19:15']);
  allText().forEach(([where, t]) => [...t.matchAll(/\b([01]\d|2[0-3]):[0-5]\d\b/g)].forEach((m) => assert(known.has(m[0]), `${where}: unknown time ${m[0]}`)));
});
test('the delay claim (k3) remains NULL: timestamps do not prove a voice call was possible', () => {
  assert.deepStrictEqual(G.claimById('k3').needs, []);
  assert(G.claimById('k3').why.includes('21:52') && G.claimById('k3').why.includes('22:40'));
  assert(/does not prove that a voice call was possible/i.test(G.claimById('k3').why));
  assert(!G.claimById('k3').why.includes('21:25'));
});
test('the timeline screen tells the player the shore-arrival time is not in the file', () => {
  assert(/does not say when the group reached the shore/i.test(G.TIMELINE.note2015));
});

// evidence
console.log('Evidence logic');
test('an anonymous accusation cannot establish guilt: the forum post is Guessed and no claim needs it as Fact', () => {
  assert.strictEqual(G.cardById('c06').truth, 'guessed');
  G.CLAIMS.forEach((c) => assert(!c.needs.includes('c06') && !(c.needsAccount || []).includes('c06'), c.id));
});
test('uncertain memories never back a TRUE/FALSE verdict as Fact', () => {
  const weak = G.CARDS.filter((c) => ['told', 'guessed'].includes(c.truth) && !c.truthIf).map((c) => c.id);
  G.CLAIMS.forEach((c) => c.needs.forEach((id) => assert(!weak.includes(id), `${c.id} leans on ${id}, which is only ${G.cardById(id).truth}`)));
});
test('the rope, the intent, Livia’s knowledge, Nell’s fate and the time of death are all NULL with no cards required', () => {
  ['k4', 'k5', 'k8', 'k9'].forEach((id) => { const c = G.claimById(id); assert.strictEqual(c.correct, 'NULL'); assert.deepStrictEqual(c.needs, []); });
});
test('nobody is named as the one who untied the rope: all three accounts stay Told or Guessed', () => {
  ['d03', 'r02', 't01'].forEach((id) => assert(['told', 'guessed'].includes(G.cardById(id).truth), id));
  assert(!G.CLAIMS.some((c) => /untied/i.test(c.text) && c.correct !== 'NULL'));
});
test('Dess’s notebook entry does not say who bolted the door, and no card claims it does', () => {
  const t = G.cardById('c08').text;
  assert(/does not say who bolted it/i.test(t));
  assert(!/and who did it/i.test(t));
});
test('no card links Nell’s phone to the 01:15 camera frame', () => {
  G.CARDS.forEach((c) => assert(!(/phone/i.test(c.text) && /01:15/.test(c.text) && /Nell/i.test(c.text)), c.id));
  assert(!/silent since/i.test(G.cardById('x04').text));
});
test('the photograph card never names the people in it', () => {
  const t = G.cardById('c01').text.replace('Taken on Teo’s phone.', ''); ['Livia', 'Dess', 'Nell', 'Teo'].forEach((n) => assert(!t.includes(n), n));
});
test('Livia rescuing Nell is backed by Nell’s own text and Livia’s account, not the photograph alone', () => {
  const k = G.claimById('k2'); assert(k.needs.includes('n03')); assert((k.needsAccount || []).includes('l01'));
  const s = G.newState(); G.ask(s, 'livia', 'livia-rescue'); G.setVerdict(s, 'k2', 'TRUE');
  G.classify(s, 'c01', 'fact'); assert.strictEqual(G.claimStatus(s, k), 'unbacked');
  G.classify(s, 'n03', 'fact'); assert.strictEqual(G.claimStatus(s, k), 'unbacked', 'Livia’s account must be on the record too');
  G.classify(s, 'l01', 'told'); assert.strictEqual(G.claimStatus(s, k), 'supported');
});
test('a missing source never counts as proof for a TRUE/FALSE claim that requires cards', () => {
  const fresh = G.newState();
  G.CLAIMS.filter((c) => c.needs.length && G.claimCorrect(fresh, c) !== 'NULL').forEach((c) => {
    const s = G.newState(); G.setVerdict(s, c.id, G.claimCorrect(s, c));
    assert.notStrictEqual(G.claimStatus(s, c), 'supported', c.id);
  });
});
test('neither sign-off nor phone metadata identifies the sender; k7 changes only after Livia’s SIM admission', () => {
  assert.deepStrictEqual(G.claimById('k7').needs, ['x03']);
  assert.strictEqual(G.claimById('k7').needsFlag, 'simFound');
  const s = G.newState();
  assert.strictEqual(G.claimCorrect(s, G.claimById('k7')), 'NULL');
  s.flags.simFound = true;
  assert.strictEqual(G.claimCorrect(s, G.claimById('k7')), 'TRUE');
});
test('every card’s notes say what it shows and what it cannot show, and never name a class', () => {
  G.CARDS.forEach((c) => { const n = G.ART.NOTES[c.id]; assert(n && n.shows && n.limit, c.id); assert(!/\b(Fact|Told|Guessed|Struck)\b/.test(n.shows + ' ' + n.limit), c.id + ' hints at its class'); });
});
test('a quoted account appears word for word in the interview that unlocks it', () => {
  const norm = (t) => t.replace(/[“”‘’"']/g, '').replace(/\s+/g, ' ').trim();
  const unlockers = {};
  Object.entries(G.INTERVIEWS).forEach(([src, iv]) => iv.topics.forEach((t) => ((t.effects || {}).unlock || []).forEach((id) => { (unlockers[id] = unlockers[id] || []).push(t); })));
  G.CARDS.filter((c) => ['dess', 'corin', 'teo', 'livia', 'wren'].includes(c.source)).forEach((c) => {
    const quote = norm(c.text.replace(/^“|”$/g, '').replace(/ Corin was at the dock, not on the boat\.$/, ''));
    const ok = (unlockers[c.id] || []).some((t) => norm(t.lines.filter((l) => !l.startsWith('>')).join(' ')).includes(quote));
    assert(ok, c.id + ' is not a word-for-word quote of what its interview says');
  });
});
test('every claim has a plain-English reason and its cards exist', () => {
  G.CLAIMS.forEach((c) => { assert(c.why && c.why.length > 30, c.id); [...c.needs, ...(c.needsAccount || [])].forEach((id) => assert(G.cardById(id), id)); });
});

// ending claims
console.log('Ending claims');
const reach = (who, mutate) => { const s = fullSolve(who); if (mutate) mutate(s); return s; };
const endingOf = (s) => G.resolveEnding(s).ending;
const bodyText = (s) => { if (!s.ending) G.resolveEnding(s); return G.endingBody(s).join(' '); };
test('every claim an ending states is in the core set THE FIVE needs, so no variant states more than THE FIVE proves', () => {
  Object.entries(G.ENDING_RULES.states).forEach(([e, ids]) => ids.forEach((id) => assert(G.ENDING_RULES.core.includes(id), e + ' states ' + id + ' which is not core')));
});
test('THE FIVE cannot be reached unless every core claim is supported', () => {
  G.ENDING_RULES.core.forEach((id) => {
    const s = fullSolve('five'); G.setVerdict(s, id, null);
    assert.notStrictEqual(endingOf(s), 'THE FIVE', id + ' unjudged still gave THE FIVE');
    const s2 = fullSolve('five'); G.setVerdict(s2, id, G.claimCorrect(s2, G.claimById(id)) === 'NULL' ? 'TRUE' : 'NULL');
    assert.notStrictEqual(endingOf(s2), 'THE FIVE', id + ' wrong still gave THE FIVE');
    G.CLAIMS.find((c) => c.id === id).needs.forEach((card) => { const s3 = fullSolve('five'); G.classify(s3, card, 'told'); assert.notStrictEqual(endingOf(s3), 'THE FIVE', id + '/' + card + ' not Fact still gave THE FIVE'); });
  });
});
test('THE LETTER can reach Wren without Livia’s confession, but leaves the sender unresolved', () => {
  const s = fullSolve('wren', { pressLivia: true });
  assert(!s.flags.simFound);
  assert.strictEqual(G.claimCorrect(s, G.claimById('k7')), 'NULL');
  assert.strictEqual(endingOf(s), 'THE LETTER');
  const text = bodyText(s);
  assert(/neither clue tells you who sent them/.test(text));
  assert(!text.includes('did not come from Nell'));
  assert(!text.includes('Livia admitted using the SIM'));
  const s2 = fullSolve('wren'); G.classify(s2, 'x04', 'told'); assert.notStrictEqual(endingOf(s2), 'THE LETTER');
});
test('THE CARD needs Livia’s admission, SIM as Fact and her trust, not unrelated core claims', () => {
  assert.strictEqual(endingOf(fullSolve('livia')), 'THE CARD');
  const a = fullSolve('livia'); G.classify(a, 'x03', 'told'); assert.notStrictEqual(endingOf(a), 'THE CARD');
  const b = fullSolve('livia'); b.flags.simFound = false; assert.notStrictEqual(endingOf(b), 'THE CARD');
  const c = fullSolve('livia'); c.trust.livia = 1; assert.notStrictEqual(endingOf(c), 'THE CARD');
  const d = fullSolve('livia'); G.setVerdict(d, 'k5', null); d.pages = 'pg-b'; assert.strictEqual(endingOf(d), 'THE CARD');
});
test('NELL / THE FIVE needs the forwarded messages, the timeline and the sign-off conclusion', () => {
  assert.strictEqual(endingOf(fullSolve('nell')), 'NELL / THE FIVE');
  const a = fullSolve('nell'); a.flags.wrenForwarded = false; assert.notStrictEqual(endingOf(a), 'NELL / THE FIVE');
  const b = fullSolve('nell'); b.timeline = 'tl-a'; assert.notStrictEqual(endingOf(b), 'NELL / THE FIVE');
  const c = fullSolve('nell'); c.pages = 'pg-d'; assert.notStrictEqual(endingOf(c), 'NELL / THE FIVE');
});
test('NULL stays a valid supported conclusion, including when the message sender is unresolved', () => {
  const s = fullSolve('five');
  const nullClaims = G.CLAIMS.filter((c) => G.claimCorrect(s, c) === 'NULL');
  assert(nullClaims.length >= 4);
  nullClaims.forEach((c) => assert.strictEqual(G.claimStatus(s, c), 'supported'));
  assert.strictEqual(endingOf(s), 'THE FIVE');
});
test('a player who refuses to accuse anyone is not punished: wrong accusations are what end in NO ANSWER', () => {
  const s = fullSolve('five'); G.setVerdict(s, 'k5', 'TRUE'); assert.strictEqual(endingOf(s), 'NO ANSWER');
  const t = fullSolve('five'); assert.strictEqual(endingOf(t), 'THE FIVE');
});
test('no ending names a murderer, a culprit for the rope, or a confirmed fate for Nell', () => {
  const bad = [/murder/i, /killed him/i, /let Arlo die/i, /untied it/i, /Nell is dead/i, /Nell is alive/i, /Nell died/i, /Livia knows where/i, /safe and well/i, /found Nell/i];
  Object.entries(G.ENDINGS).forEach(([name, e]) => e.body.map((b) => (typeof b === 'string' ? b : b.t)).forEach((t) => bad.forEach((re) => assert(!re.test(t), `${name}: "${t.slice(0, 70)}" matches ${re}`))));
});
test('no ending says Nell packed and left successfully', () => {
  Object.entries(G.ENDINGS).forEach(([name, e]) => e.body.map((b) => (typeof b === 'string' ? b : b.t)).forEach((t) => assert(!/packed her own bag and left/i.test(t) && !/left successfully/i.test(t), name)));
});
test('THE FIVE states the 48 minutes, the recorded vote, message limits and open questions', () => {
  const t = bodyText(fullSolve('five')); ['drowned', '48 minutes', 'vote wasn’t unanimous', 'who sent them', 'who untied the rope', 'where Nell is'].forEach((w) => assert(t.includes(w), w));
  assert(t.includes('MIST'));
});
test('conditional paragraphs appear only when earned: the SIM line needs the SIM found and classed Fact', () => {
  const a = fullSolve('five'); assert(bodyText(a).includes('A SIM card with that number')); 
  const b = fullSolve('five'); G.classify(b, 'x03', 'told'); assert(!bodyText(b).includes('A SIM card with that number')); 
  const c = fullSolve('five'); c.flags.dessAdmitted = false; assert(!bodyText(c).includes('Dess has told you'));
});
test('THE LETTER does not promise that Nell is alive or dead, or that her location is known', () => {
  const t = bodyText(fullSolve('wren')); assert(/don’t know where Nell is/.test(t)); assert(!/is alive|is dead|has been found/i.test(t));
});
test('THE CARD lets Livia’s motive and her wrongdoing stand together, and says the card does not show where Nell is', () => {
  const t = bodyText(fullSolve('livia')); assert(/stop worrying/.test(t)); assert(/She deserves to know/.test(t)); assert(/where Nell is/.test(t));
});
test('STRUCK and THE SAME SENTENCE do not blame a player for correct uncertainty: the explanation says what to do instead', () => {
  const s = fullSolve('five'); ['c04', 'b01', 'c06', 'r01', 't01', 'd03'].forEach((id) => G.classify(s, id, 'struck'));
  assert.strictEqual(endingOf(s), 'STRUCK');
  const ex = G.explainEnding(s); assert(ex.lines.some((l) => l.kind === 'strike' && /Told or Guessed/.test(l.text)));
});
test('every ending can be reached by an understandable route, and each explanation is non-empty', () => {
  const got = {};
  [['five', 'THE FIVE'], ['wren', 'THE LETTER'], ['livia', 'THE CARD'], ['nell', 'NELL / THE FIVE']].forEach(([who, e]) => { const s = fullSolve(who); got[endingOf(s)] = 1; assert.strictEqual(s.ending, e); assert(G.explainEnding(s).lines.length); });
  const st = fullSolve('five'); ['c01', 'c02', 'c03'].forEach((id) => G.classify(st, id, 'struck')); got[endingOf(st)] = 1;
  const same = fullSolve('five'); retell(same, 'A1', 'B1', 'C1', 'five'); got[endingOf(same)] = 1;
  const none = G.newState(); G.CLAIMS.forEach((c) => G.setVerdict(none, c.id, 'NULL')); retell(none, 'A2', 'B3', 'C3', 'five'); got[endingOf(none)] = 1;
  assert.deepStrictEqual(Object.keys(got).sort(), ['NELL / THE FIVE', 'NO ANSWER', 'STRUCK', 'THE CARD', 'THE FIVE', 'THE LETTER', 'THE SAME SENTENCE']);
});
test('the explanation names wrong verdicts in plain English and does not change state', () => {
  const s = fullSolve('five'); G.setVerdict(s, 'k3', 'TRUE'); const before = JSON.stringify(s);
  const ex = G.explainEnding(s); assert.strictEqual(JSON.stringify(s), before);
  assert(ex.lines.some((l) => l.text.includes('You ruled TRUE on this claim: “' + G.claimById('k3').text + '”')));
});
test('the retell options match the facts: the owned sentence says 48 minutes and the agreed one is the group’s line', () => {
  assert(G.RETELL.B.options.find((o) => o.tag === 'owned').text.includes('48 minutes'));
  assert.strictEqual(G.RETELL.B.options.find((o) => o.tag === 'agreed').text, 'We called as soon as we could.');
});

// consistency
console.log('Consistency');
test('the boat is called MIST everywhere and never ARLO', () => {
  allText().forEach(([where, t]) => assert(!/\bARLO\b/.test(t), `${where}: ARLO in "${t.slice(0, 60)}"`));
  const joined = allText().map((x) => x[1]).join(' '); assert(joined.includes('MIST'));
  ['js', 'css', 'tools', 'assets', 'tests'].forEach((dir) => {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'shots' && e.name !== 'fonts') walk(f); }
      else if (/\.(js|css|svg|py|html)$/.test(e.name) && !f.includes(path.join('tests', 'browser.py')) && !f.endsWith('tests/run.js')) assert(!/\bARLO\b/.test(fs.readFileSync(f, 'utf8')), f + ' still says ARLO');
    });
    walk(path.join(ROOT, dir));
  });
  assert(!/\bARLO\b/.test(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')));
});
test('Arlo Penn is still the victim’s name, and the boat name is not used for him', () => {
  assert.strictEqual(G.FACTS.victim, 'Arlo Penn'); assert.strictEqual(G.FACTS.boat, 'MIST');
  assert(G.INTRO.join(' ').includes('Arlo Penn was found drowned the next morning')); assert(G.cardById('c05').text.includes('Arlo Penn'));
  assert(G.claimById('k1').text.includes('Arlo Penn'));
  allText().forEach(([where, t]) => assert(!/\bMIST (Penn|died|drowned)\b/.test(t), where));
});
test('character names are spelled one way only', () => {
  const names = { Dess: /\bDes\b/, Livia: /\bLivea\b|\bLiv\b/, Corin: /\bCorrin\b|\bCoren\b/, Teo: /\bTeoh\b/, Wren: /\bRen\b/ };
  allText().forEach(([where, t]) => Object.entries(names).forEach(([n, re]) => assert(!re.test(t), `${where}: odd spelling of ${n}`)));
});
test('the vote is described one way everywhere: three different answers, never “five different votes”', () => {
  allText().forEach(([where, t]) => assert(!/five different (votes|positions|answers)/i.test(t), where));
  assert(/two TRUE, two NULL and one FALSE/.test(G.claimById('k6').why));
});
test('every evidence reference resolves: board links, places, claims and timeline use real cards', () => {
  const ids = new Set(G.CARDS.map((c) => c.id));
  [...G.LINKS, ...G.CONTRADICTIONS].forEach((x) => assert(ids.has(x.a) && ids.has(x.b)));
  Object.values(G.ART.CLAIM_CARDS).flat().forEach((id) => assert(ids.has(id), id));
  G.ART.PLACES.forEach((pl) => pl.cards.forEach((id) => assert(ids.has(id), id)));
  G.TIMELINE.events.forEach((e) => assert(ids.has(e.card)));
  Object.keys(G.ART.NOTES).forEach((id) => assert(ids.has(id), 'notes for unknown ' + id));
});
test('the fonts the CSS points at exist on disk and nothing in the CSS loads from the network', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  [...css.matchAll(/url\("\.\.\/(assets\/fonts\/[^"]+)"\)/g)].forEach((m) => assert(fs.existsSync(path.join(ROOT, m[1])), m[1]));
  assert(!/url\(\s*["']?https?:/.test(css)); assert(!/@import/.test(css));
});

// save / load
console.log('Save');
test('save then load round-trips state', () => {
  const st = memStore(); const s = fullSolve('five'); s.screen = 'verdicts';
  assert(G.save(s, st));
  const l = G.load(st);
  assert.deepStrictEqual(l, s);
});
test('empty saves return null; corrupt and future-version saves are preserved for recovery', () => {
  const st = memStore();
  assert.strictEqual(G.load(st), null);
  st.setItem(G.SAVE_KEY, '{not json'); assert.strictEqual(G.load(st), null);
  assert.strictEqual(st.getItem(G.RECOVERY_KEY), '{not json');
  const future = JSON.stringify({ v: 99, unlocked: [], trust: {} });
  st.setItem(G.SAVE_KEY, future); assert.strictEqual(G.load(st), null);
  assert.strictEqual(st.getItem(G.RECOVERY_KEY), future);
  assert.strictEqual(st.getItem(G.SAVE_KEY), future);
});
test('loading repairs damaged and older saves, fills safe defaults and never grants excess trust', () => {
  const st = memStore(); const s = G.newState(); delete s.verdicts; delete s.retell;
  s.trust = null; s.flags = null; s.unlocked = ['c01', 'not-a-card'];
  st.setItem(G.SAVE_KEY, JSON.stringify(s));
  const l = G.load(st);
  assert.deepStrictEqual(l.verdicts, {}); assert.deepStrictEqual(l.retell, {});
  assert.deepStrictEqual(l.trust, G.START_TRUST);
  assert(G.CARDS.filter((c) => c.start).every((c) => l.unlocked.includes(c.id)));
  assert(!l.unlocked.includes('not-a-card'));
  assert(G.loadWarning);
  const s2 = G.newState(); s2.trust = {}; st.setItem(G.SAVE_KEY, JSON.stringify(s2));
  assert.deepStrictEqual(G.load(st).trust, G.START_TRUST);
});
test('clearSave removes the save; a throwing storage never throws out', () => {
  const st = memStore(); G.save(G.newState(), st); assert(G.clearSave(st)); assert.strictEqual(G.load(st), null);
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  assert.strictEqual(G.save(G.newState(), bad), false);
  assert.strictEqual(G.load(bad), null);
  assert.strictEqual(G.clearSave(bad), false);
});

// Final review
console.log('Final review');
// Ask each non-press topic until no new question opens.
function askEverythingGentle() {
  const s = G.newState(); let moved = true;
  while (moved) {
    moved = false;
    Object.entries(G.INTERVIEWS).forEach(([src, iv]) => iv.topics.forEach((t) => {
      if (t.tone !== 'press' && G.topicAvailable(s, src, t).ok) { assert(G.ask(s, src, t.id).ok); moved = true; }
    }));
  }
  return s;
}
test('fairness: without pressing anyone, every card a core claim needs can be found, and nothing needed hides behind a press question', () => {
  const s = askEverythingGentle();
  G.ENDING_RULES.core.forEach((id) => {
    const c = G.claimById(id);
    [...(c.needs || []), ...(c.needsAccount || [])].forEach((card) => assert(s.unlocked.includes(card), id + ' needs ' + card + ', which a player who never presses cannot reach'));
  });
});
test('fairness: a player who never presses anyone can still reach THE FIVE and all three special endings', () => {
  ['five', 'wren', 'livia', 'nell'].forEach((who) => {
    const s = askEverythingGentle(); classifyIdeal(s);
    assert(G.answerTimeline(s, 'tl-b').correct); G.answerPages(s, 'pg-c'); verdictsIdeal(s); retell(s, 'A3', 'B2', 'C1', who);
    const want = { five: 'THE FIVE', wren: 'THE LETTER', livia: 'THE CARD', nell: 'NELL / THE FIVE' }[who];
    assert.strictEqual(endingOf(s), want, who + ' gave ' + s.ending);
  });
});
test('fairness: every core TRUE/FALSE claim cites only records (Fact cards the file itself holds), never an interview', () => {
  G.ENDING_RULES.core.forEach((id) => (G.claimById(id).needs || []).forEach((card) => assert.strictEqual(G.cardById(card).truth, 'fact', id + ' needs ' + card + ' which is not a Fact card')));
});
test('fairness: pressing is never needed to reach THE FIVE, and the only press questions are labelled as such', () => {
  const press = []; Object.values(G.INTERVIEWS).forEach((iv) => iv.topics.forEach((t) => { if (t.tone === 'press') press.push(t.id); }));
  assert(press.length > 0);
  const s = askEverythingGentle(); press.forEach((id) => assert(!s.asked.includes(id), id + ' was asked on the gentle route'));
});
test('ending page: the same kind of mistake is explained once, even if made in two slots', () => {
  const s = fullSolve('five'); G.chooseRetell(s, 'A', 'A1'); G.chooseRetell(s, 'B', 'B1'); G.resolveEnding(s);
  assert.strictEqual(s.ending, 'THE SAME SENTENCE');
  assert.strictEqual(G.explainEnding(s).lines.filter((l) => l.kind === 'retell').length, 1);
  const t = fullSolve('five'); G.chooseRetell(t, 'A', 'A2'); G.chooseRetell(t, 'B', 'B3'); G.chooseRetell(t, 'C', 'C3'); G.resolveEnding(t);
  const notes = G.explainEnding(t).lines.filter((l) => l.kind === 'retell').map((l) => l.text);
  assert.strictEqual(new Set(notes).size, notes.length, 'a note repeated');
});
test('endings: the vote is only said to have been called unanimous when Dess told the player so', () => {
  const s = fullSolve('five'); G.resolveEnding(s);
  assert(G.endingBody(s).join(' ').includes('Dess told you everyone voted NULL'));
  s.unlocked = s.unlocked.filter((id) => id !== 'd05');
  const text = G.endingBody(s).join(' ');
  assert(!text.includes('Dess told you everyone voted NULL'));
  assert(!/group (said|called)[^.]*unanimous/i.test(text));
  Object.values(G.ENDINGS).forEach((e) => e.body.map((b) => (typeof b === 'string' ? b : b.t)).forEach((t) => assert(!/group (said|called)[^.]*unanimous/i.test(t), 'ending asserts what the group said without a condition')));
});
test('endings: nothing says the file points at Dess for “the shared story” unless Teo’s account is in the file', () => {
  Object.values(G.ENDINGS).forEach((e) => e.body.map((b) => (typeof b === 'string' ? b : b.t)).forEach((t) => assert(!/points most at Dess/.test(t))));
});
test('places: nothing that happened on the water is listed under a place on land', () => {
  const land = G.ART.PLACES.flatMap((p) => p.cards);
  ['c01', 'l01'].forEach((id) => assert(!land.includes(id), id + ' happened on the water'));
});
test('places: no description claims Mr Okafor is the only outside voice (the depot clerk and the coroner are outside the group too)', () => {
  G.ART.PLACES.forEach((p) => assert(!/only statement/i.test(p.text)));
});
test('text: no player-facing sentence has a doubled space, a repeated word or a straight apostrophe', () => {
  const out = []; (function walk(o) { if (typeof o === 'string') out.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); })([G.CARDS, G.INTERVIEWS, G.ENDINGS, G.RETELL, G.RETELL_NOTES, G.CLAIMS, G.LINKS, G.PAGES, G.TIMELINE, G.CONTRADICTIONS, G.INTRO, G.HOW_TO, G.ART.PLACES.map((p) => p.text), Object.values(G.ART.NOTES)]);
  out.forEach((t) => {
    assert(!/  /.test(t), 'double space: ' + t.slice(0, 50));
    assert(!/\b(\w+) \1\b/i.test(t) || /-- N/.test(t), 'repeated word: ' + t.slice(0, 50));
    assert(!/[A-Za-z]'[A-Za-z]/.test(t), 'straight apostrophe: ' + t.slice(0, 50));
  });
});
test('dialogue: the lines of a topic never repeat another line in the same interview', () => {
  Object.entries(G.INTERVIEWS).forEach(([src, iv]) => {
    const seen = new Set();
    iv.topics.forEach((t) => t.lines.forEach((l) => {
      if (l.startsWith('>')) return;
      // A card may quote an earlier answer, but a single interview should not repeat itself.
      assert(!seen.has(l), src + ' repeats a line: ' + l.slice(0, 50)); seen.add(l);
    }));
  });
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
