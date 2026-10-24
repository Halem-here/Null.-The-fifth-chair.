/* Diagnostic probe for the letter-ending gate; not part of the pass/fail suite.
 * Run: node tests/probes/ending-gates.js
 * Leaves the sender claim and sign-off puzzle unresolved, then prints the allowed ending.
 * This route should not reach THE LETTER; tests/run.js covers the same case.
 */
const path = require('path');
const root = path.join(__dirname, '..', '..');
for (const f of ['data-facts', 'data-cards', 'data-interviews', 'data-story', 'data-links', 'engine']) require(path.join(root, 'js', f + '.js'));
const G = globalThis.NULLGAME;
const s = G.newState();
const ask = (src, id) => { const r = G.ask(s, src, id); if (!r.ok) throw new Error(src + ':' + id + ' ' + r.reason); };
ask('wren', 'wren-last'); ask('wren', 'wren-where'); ask('wren', 'wren-meta'); ask('wren', 'wren-tell');
ask('dess', 'dess-what'); ask('dess', 'dess-when'); ask('dess', 'dess-safe'); ask('dess', 'dess-rope');
ask('teo', 'teo-rope'); ask('corin', 'corin-rope'); ask('livia', 'livia-rescue');
for (const c of s.unlocked) G.classify(s, c, G.effectiveTruth(G.cardById(c), s));
G.answerTimeline(s, 'tl-b');
for (const k of G.CLAIMS) if (k.id !== 'k7') G.setVerdict(s, k.id, k.correct);
G.chooseRetell(s, 'A', 'A3'); G.chooseRetell(s, 'B', 'B2'); G.chooseRetell(s, 'C', 'C1'); G.chooseAddressee(s, 'wren');
const r = G.resolveEnding(s);
console.log('k7 judged:', 'k7' in s.verdicts, '| sign-off puzzle answered:', !!s.pages, '| x02 in file:', s.unlocked.includes('x02'));
console.log('ending reached:', r.ending);
