/* Browser UI for NULL. Clicks update the engine state, save it and redraw the screen.
 * Story copy is inserted as text, not HTML. Artwork never affects the rules.
 */
(function () {
  const G = window.NULLGAME;
  const ART = G.ART;
  const { h, p, CLASS_LABEL, badge, portrait, artifact, provenance } = window.NULLUI;
  const view = document.getElementById('view');
  const bar = document.getElementById('bar');
  const nav = document.getElementById('nav');
  const hint = document.getElementById('hint');
  const languageSwitch = document.getElementById('language-switch');

  let storage = null;
  try { storage = window.localStorage; storage.getItem('x'); } catch (e) { storage = null; } // blocked storage: play without saving

  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let state = (storage && G.load(storage)) || G.newState();
  try {
    const language = storage && storage.getItem(G.LANG_KEY);
    if (language === 'en' || language === 'ur') state.lang = language;
  } catch (e) { /* language remains available for this session */ }
  let recoveryMessage = G.loadWarning;
  if (G.setLanguage) G.setLanguage(state.lang);
  let showTitle = true;
  let person = 'dess';
  let notice = null;          // one-line message after an interview action
  let confirmingNew = false;
  let latestTopic = null;     // the exchange to bring into view after asking
  let evFilter = 'all';       // evidence filter
  let boardSel = [];          // up to two card ids chosen on the board
  let placeId = ART.PLACES[0].id;
  const tlOpen = new Set();   // expanded timeline events

  const SCREENS = [
    ['briefing', 'Story'], ['evidence', 'Evidence'], ['interviews', 'Interviews'], ['places', 'Places'],
    ['timeline', 'Timeline'], ['board', 'Case board'], ['pages', 'Pages'], ['verdicts', 'Verdicts'], ['retell', 'Retelling'],
  ];

  function persist() {
    if (storage && G.save(state, storage)) recoveryMessage = null;
  }

  function updateLanguageChrome() {
    const lang = state.lang === 'ur' ? 'ur-Latn' : 'en';
    document.documentElement.lang = lang;
    document.title = G.t ? G.t('NULL — The Fifth Chair') : 'NULL — The Fifth Chair';
    const skip = document.querySelector('.skip');
    if (skip && G.t) skip.textContent = G.t('Skip to the file');
    const menu = document.getElementById('menu-btn');
    if (menu && G.t) menu.setAttribute('aria-label', G.t('Menu'));
    if (nav && G.t) nav.setAttribute('aria-label', G.t('The file'));
    if (languageSwitch) {
      languageSwitch.setAttribute('aria-label', G.t ? G.t('Language') : 'Language');
      languageSwitch.querySelectorAll('[data-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === state.lang)));
    }
  }

  languageSwitch.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-lang]');
    if (!button || !['en', 'ur'].includes(button.dataset.lang) || button.dataset.lang === state.lang) return;
    state.lang = button.dataset.lang;
    if (G.setLanguage) G.setLanguage(state.lang);
    try { if (storage) storage.setItem(G.LANG_KEY, state.lang); } catch (e) { /* session-only choice */ }
    if (!showTitle) persist(); // the language preference is already stored separately; do not create an empty save from the title screen
    render();
    if (inspectId) buildInspect();
  });

  function resetLocal() {
    person = 'dess'; notice = null; latestTopic = null; evFilter = 'all'; boardSel = []; placeId = ART.PLACES[0].id; tlOpen.clear();
  }

  // Keep keyboard focus on the active control after the screen redraws.
  function render(opts) {
    const active = document.activeElement;
    const key = active && active.getAttribute && active.getAttribute('data-key');
    const y = window.scrollY;
    view.replaceChildren();
    updateLanguageChrome();
    document.body.setAttribute('data-screen', showTitle ? 'title' : state.screen);
    bar.hidden = showTitle || state.screen === 'ending';
    if (showTitle) renderTitle();
    else { renderNav(); renderScreen(); }
    if (recoveryMessage && !showTitle) view.prepend(p(recoveryMessage, 'recovery-notice'));
    if (opts && opts.focusTop) {
      view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
      view.focus({ preventScroll: true }); window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, y);
      if (key) { const el = document.querySelector('[data-key="' + key + '"]'); if (el && el !== active) el.focus({ preventScroll: true }); }
    }
    if (!showTitle && state.screen === 'board') requestAnimationFrame(drawStrings);
    if (latestTopic && !showTitle && state.screen === 'interviews') {
      const el = view.querySelector('.exch.latest');
      if (el) el.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
      latestTopic = null;
    }
  }

  function go(screen) { state.screen = screen; notice = null; persist(); closeInspect(); render({ focusTop: true }); }

  // Navigation and progress
  function navStatus(id, pr) {
    switch (id) {
      case 'evidence': return { t: pr.classified + '/' + pr.cards, done: pr.classified === pr.cards };
      case 'board': return { t: pr.pins ? String(pr.pins) : '' };
      case 'interviews': return { t: pr.asked ? String(pr.asked) : '' };
      case 'timeline': return pr.timelineDone ? { t: '', done: true } : { t: '' };
      case 'pages': return pr.pagesDone ? { t: '', done: true } : { t: '' };
      case 'verdicts': return { t: pr.ruled + '/' + pr.claims, done: pr.ruled === pr.claims };
      case 'retell': return { t: pr.retellChosen + '/' + pr.retellTotal, done: pr.retellChosen === pr.retellTotal };
      default: return { t: '' };
    }
  }

  function renderNav() {
    const pr = G.progress(state);
    nav.replaceChildren(...SCREENS.map(([id, label]) => {
      const locked = id === 'pages' && !state.unlocked.includes('x02');
      const st = navStatus(id, pr);
      return h('button', {
        type: 'button', disabled: locked, 'aria-current': state.screen === id ? 'page' : false, 'data-screen': id, 'data-done': st.done ? 'yes' : false,
        title: locked ? 'You have nothing to compare yet.' : false, on: { click: () => go(id) },
      }, h('span', { class: 'lab', text: label }),
      st.done ? h('span', { class: 'st done', 'aria-hidden': 'true', text: '✓' }) : (st.t ? h('span', { class: 'st', text: st.t }) : null),
      st.done ? h('span', { class: 'sr', text: ' (complete)' }) : null);
    }));
    const next = G.nextStep(state);
    hint.replaceChildren(h('button', { type: 'button', class: 'next', 'data-key': 'next-step', on: { click: () => go(next.screen) } },
      h('span', { class: 'k', text: 'Next' }), ' ' + next.text));
  }

  function renderScreen() {
    const s = state.screen;
    if (s === 'briefing' || s === 'title') return renderBriefing();
    ({ evidence: renderEvidence, board: renderBoard, interviews: renderInterviews, places: renderPlaces, timeline: renderTimeline,
       pages: renderPages, verdicts: renderVerdicts, retell: renderRetell, ending: renderEnding }[s] || renderEvidence)();
  }

  // Title and briefing
  function renderTitle() {
    const started = state.screen !== 'title';
    const pr = G.progress(state);
    const kids = [
      h('p', { class: 'case', text: 'Case file: Greywater and the Hartwell house' }),
      h('h1', { text: 'NULL' }),
      p('THE FIFTH CHAIR', 'sub'),
      p('A mystery about a boat, a vote, and the story a group agreed to tell. It runs in this browser and saves your progress here.', 'lede'),
    ];
    if (recoveryMessage) kids.push(p(recoveryMessage, 'recovery-notice'));
    if (started) kids.push(p(state.screen === 'ending'
      ? 'You have reached an ending: ' + state.ending + '.'
      : 'Resume: ' + pr.asked + ' question' + (pr.asked === 1 ? '' : 's') + ' asked, ' + pr.classified + ' of ' + pr.cards + ' cards classified, ' + pr.ruled + ' of ' + pr.claims + ' claims ruled on.', 'resume'));
    const row = h('div', { class: 'row' });
    if (started) row.append(h('button', { class: 'btn', type: 'button', 'data-key': 'continue', on: { click: () => { showTitle = false; render({ focusTop: true }); } } }, 'Continue'));
    if (started && !confirmingNew) {
      row.append(h('button', { class: 'btn quiet', type: 'button', 'data-key': 'new', on: { click: () => { confirmingNew = true; render(); } } }, 'New game'));
    } else if (started && confirmingNew) {
      row.append(h('button', { class: 'btn warn', type: 'button', 'data-key': 'new-yes', on: { click: startNew } }, 'Erase my progress and start over'),
                 h('button', { class: 'btn quiet', type: 'button', on: { click: () => { confirmingNew = false; render(); } } }, 'Cancel'));
    } else row.append(h('button', { class: 'btn', type: 'button', on: { click: startNew } }, 'Begin'));
    kids.push(row);
    view.append(h('section', { class: 'title-screen' },
      h('div', { class: 'hero-art', 'aria-hidden': 'true' }, h('img', { src: ART.HERO.img, alt: '', width: 1600, height: 900 }), h('div', { class: 'fog f1' }), h('div', { class: 'fog f2' })),
      h('div', { class: 'title-copy' }, kids)));
  }

  function startNew() {
    const language = state.lang;
    if (storage) G.clearSave(storage);
    state = G.newState(); state.lang = language; state.screen = 'briefing'; recoveryMessage = null;
    if (G.setLanguage) G.setLanguage(state.lang);
    confirmingNew = false; showTitle = false; resetLocal(); closeInspect();
    persist(); render({ focusTop: true });
  }

  function renderBriefing() {
    const cast = ['dess', 'corin', 'teo', 'livia', 'wren', 'nell'];
    view.append(
      h('figure', { class: 'brief-art' }, h('img', { src: 'assets/places/house.svg', alt: 'The Hartwell house at night, windows lit.', width: 1200, height: 675 })),
      h('h1', { text: 'The file' }),
      h('div', { class: 'brief' }, G.INTRO.map((t, i) => p(t, 'lede' + (i === G.INTRO.length - 1 ? ' last' : '')))),
      h('div', { class: 'rule4' }, h('span', { class: 'k', text: 'House Rule 4' }), h('strong', { text: G.HOUSE_RULE_4 })),
      h('section', { class: 'howto', 'aria-label': 'How the game works' },
        h('h2', { text: 'What TRUE, FALSE and NULL mean' }),
        h('ul', { class: 'rules' }, ['TRUE', 'FALSE', 'NULL'].map((v) => h('li', { 'data-v': v }, h('span', { class: 'vw', text: v }), G.RULES[v].slice(v.length + 2)))),
        p('Three more things to keep in mind. An unproven claim is not automatically false. A person who looks suspicious is not automatically guilty. Two accounts that disagree do not tell you which one is right.', 'quiet'),
        h('h2', { text: 'How to play' }),
        h('ol', {}, G.HOW_TO.map((t) => h('li', { text: t })))),
      h('section', { class: 'cast', 'aria-label': 'The people in the file' },
        h('h2', { text: 'The people in the file' }),
        h('ul', {}, cast.map((id) => h('li', {}, portrait(id, 'cast-portrait'), h('span', { class: 'nm', text: ART.PEOPLE[id].name }), h('span', { class: 'tg', text: ART.PEOPLE[id].tag }))))),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', on: { click: () => go('evidence') } }, 'Open the evidence')));
  }

  // Evidence
  const sourceOrder = Object.keys(G.SOURCES);
  const orderedIds = () => sourceOrder.flatMap((src) => G.CARDS.filter((c) => c.source === src && state.unlocked.includes(c.id)).map((c) => c.id));

  function renderEvidence() {
    const clashes = G.activeContradictions(state);
    const inClash = new Set(clashes.flatMap((c) => [c.a, c.b]));
    const unlocked = G.CARDS.filter((c) => state.unlocked.includes(c.id));
    const count = (f) => unlocked.filter((c) => matches(c, f)).length;
    function matches(c, f) {
      if (f === 'all') return true;
      if (f === 'none') return !state.classes[c.id];
      if (f === 'clash') return inClash.has(c.id);
      return state.classes[c.id] === f;
    }
    const filters = [['all', 'All'], ['none', 'Unclassified'], ['fact', 'Fact'], ['told', 'Told'], ['guessed', 'Guessed'], ['struck', 'Struck'], ['clash', 'In conflict']];
    view.append(
      h('div', { class: 'page-head' }, h('h1', { text: 'Evidence' }),
        p('Every item in the file, shown as what it is. Under each one is what it shows and what it cannot show. Sort each card as Fact, Told, Guessed or Struck.', 'lede')),
      h('div', { class: 'key', 'aria-label': 'What the classes mean' },
        ['fact', 'told', 'guessed', 'struck'].map((c) => h('div', { class: 'key-i', 'data-cls': c }, badge(c), h('span', { text: ART.CLASS_MEANING[c] })))),
      h('div', { class: 'filters', role: 'group', 'aria-label': 'Filter the evidence' },
        filters.map(([id, label]) => h('button', {
          type: 'button', class: 'chip', 'data-key': 'flt-' + id, 'aria-pressed': String(evFilter === id),
          on: { click: () => { evFilter = id; render(); } } }, label + ' ', h('span', { class: 'n', text: String(count(id)) })))));
    let shown = 0;
    sourceOrder.forEach((src) => {
      const cards = unlocked.filter((c) => c.source === src && matches(c, evFilter));
      if (!cards.length) return;
      shown += cards.length;
      const pid = ART.SOURCE_PERSON[src];
      view.append(h('section', { class: 'group' },
        h('h3', { class: 'group-h' }, pid ? portrait(pid, 'chip-portrait') : h('span', { class: 'src-mark', 'aria-hidden': 'true', text: src === 'records' ? '▤' : '◇' }), ART.SOURCE_LABEL[src]),
        h('div', { class: 'cards' }, cards.map((c) => cardEl(c, clashes)))));
    });
    if (!shown) view.append(p('Nothing in the file matches this filter yet.', 'empty'));
  }

  function notesEl(id) {
    const n = ART.NOTES[id]; if (!n) return null;
    return h('dl', { class: 'notes' },
      h('dt', { text: 'Shows' }), h('dd', { text: n.shows }),
      h('dt', { text: 'Cannot show' }), h('dd', { text: n.limit }));
  }

  function cardEl(card, clashes, inspectorOnly) {
    const cls = state.classes[card.id];
    const m = ART.cardMeta(card);
    const mine = clashes.filter((c) => c.a === card.id || c.b === card.id);
    return h('article', { class: 'card', 'data-cls': cls || 'none', 'data-kind': m.kind, 'data-id': card.id },
      h('header', { class: 'card-head' },
        h('div', { class: 'card-kicker' }, h('span', { class: 'kind', text: m.label }), provenance(m)),
        h('h4', { text: card.title }), badge(cls)),
      artifact(card),
      h('p', { class: 'origin' }, m.when + ' · ' + m.origin),
      notesEl(card.id),
      h('div', { class: 'card-actions' },
        h('div', { class: 'classes', role: 'group', 'aria-label': 'Classify: ' + card.title },
          G.CLASSES.map((c) => h('button', {
            type: 'button', 'data-c': c, 'data-key': 'cls-' + card.id + '-' + c, 'aria-pressed': String(cls === c),
            on: { click: () => { G.classify(state, card.id, cls === c ? null : c); persist(); render(); } },
          }, CLASS_LABEL[c]))),
        h('button', { type: 'button', class: 'btn quiet small examine', 'data-key': 'ex-' + card.id, 'aria-label': 'Examine: ' + card.title,
          on: { click: () => openInspect(card.id, 'ex-' + card.id) } }, 'Examine')),
      mine.map((c) => {
        const other = G.cardById(c.a === card.id ? c.b : c.a);
        return h('div', { class: 'clash' }, h('strong', { text: 'Conflict: ' }), 'this does not fit with “' + other.title + '”. ' + c.why);
      }));
  }

  // Evidence inspector
  const dlg = h('dialog', { id: 'inspect', 'aria-labelledby': 'ins-title' });
  document.body.append(dlg);
  let inspectId = null, openerKey = null, zoomed = false;
  const dlgOpen = () => dlg.open || dlg.hasAttribute('open');

  function openInspect(id, fromKey) {
    inspectId = id; openerKey = fromKey || openerKey; zoomed = false;
    buildInspect();
    if (!dlgOpen()) {
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      document.body.classList.add('modal-open');
    }
    const c = dlg.querySelector('[data-key="ins-close"]'); if (c) c.focus();
  }

  function closeInspect() {
    if (!dlgOpen()) return;
    if (typeof dlg.close === 'function') dlg.close(); else { dlg.removeAttribute('open'); afterClose(); }
  }

  function afterClose() {
    document.body.classList.remove('modal-open');
    inspectId = null;
    const el = openerKey && document.querySelector('[data-key="' + openerKey + '"]');
    if (el) el.focus({ preventScroll: true }); else if (!showTitle) view.focus({ preventScroll: true });
  }
  dlg.addEventListener('close', afterClose);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeInspect(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dlg.showModal) closeInspect(); // only needed where <dialog> is not native
    if (!inspectId || e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { stepInspect(e.key === 'ArrowRight' ? 1 : -1); e.preventDefault(); }
  });

  function stepInspect(d) {
    const ids = orderedIds(); const i = ids.indexOf(inspectId);
    if (i < 0) return;
    inspectId = ids[(i + d + ids.length) % ids.length]; zoomed = false;
    buildInspect(); const b = dlg.querySelector('[data-key="ins-' + (d > 0 ? 'next' : 'prev') + '"]'); if (b) b.focus();
  }

  function buildInspect() {
    if (!inspectId) return;
    const active = document.activeElement; const key = dlg.contains(active) && active.getAttribute('data-key');
    const card = G.cardById(inspectId); const m = ART.cardMeta(card); const cls = state.classes[card.id];
    const rels = G.knownRelations(state).filter((r) => r.a === card.id || r.b === card.id);
    const meta = [['Type', m.label], ['Source', ART.SOURCE_LABEL[card.source]], ['When', m.when], ['Origin', m.origin], ['Kind of source', m.from === 'record' ? 'A record: a log, photograph or document.' : 'An account: somebody’s own word.']];
    const status = cls ? ART.CLASS_MEANING[cls] : 'You have not sorted this yet. Decide what it is before you rely on it.';
    dlg.replaceChildren(h('div', { class: 'ins', 'data-cls': cls || 'none' },
      h('div', { class: 'ins-top' },
        h('span', { class: 'kind', text: m.label }), provenance(m),
        h('button', { type: 'button', class: 'btn quiet close', 'data-key': 'ins-close', on: { click: closeInspect } }, 'Close')),
      h('h2', { id: 'ins-title', text: card.title }),
      h('div', { class: 'ins-body' },
        h('div', { class: 'ins-art' }, artifact(card, { big: true, zoomed }),
          m.img ? h('button', { type: 'button', class: 'btn quiet zoom', 'data-key': 'ins-zoom', 'aria-pressed': String(zoomed),
            on: { click: () => { zoomed = !zoomed; buildInspect(); } } }, zoomed ? 'Fit to window' : 'Enlarge image') : null),
        h('aside', { class: 'ins-side' },
          h('dl', { class: 'meta' }, meta.map(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })])),
          notesEl(card.id),
          h('div', { class: 'status' }, badge(cls), h('p', { text: status })),
          h('div', { class: 'classes', role: 'group', 'aria-label': 'Classify: ' + card.title },
            G.CLASSES.map((c) => h('button', {
              type: 'button', 'data-c': c, 'data-key': 'm-cls-' + card.id + '-' + c, 'aria-pressed': String(cls === c),
              on: { click: () => { G.classify(state, card.id, cls === c ? null : c); persist(); render(); buildInspect(); } } }, CLASS_LABEL[c]))),
          h('h3', { text: 'How it connects' }),
          rels.length ? h('ul', { class: 'rels' }, rels.map((r) => {
            const oid = r.a === card.id ? r.b : r.a; const o = G.cardById(oid);
            return h('li', { 'data-status': r.status },
              h('button', { type: 'button', class: 'linkbtn', 'data-key': 'ins-open-' + oid, on: { click: () => { inspectId = oid; zoomed = false; buildInspect(); } } }, o.title),
              relBadge(r.status), h('p', { text: r.why }));
          })) : p('The file records no connection to anything else you hold yet.', 'quiet'),
          h('button', { type: 'button', class: 'btn quiet', 'data-key': 'ins-board', on: { click: () => { boardSel = [card.id]; go('board'); } } }, 'Show on the case board'))),
      h('div', { class: 'ins-nav' },
        h('button', { type: 'button', class: 'btn quiet', 'data-key': 'ins-prev', on: { click: () => stepInspect(-1) } }, '← Previous item'),
        h('button', { type: 'button', class: 'btn quiet', 'data-key': 'ins-next', on: { click: () => stepInspect(1) } }, 'Next item →'))));
    if (key) { const el = dlg.querySelector('[data-key="' + key + '"]'); if (el) el.focus({ preventScroll: true }); }
  }

  const REL_TEXT = { disputed: 'Disputed', resolved: 'Resolved: one side struck', supported: 'Supported', uncertain: 'Uncertain' };
  const REL_MARK = { disputed: '≠', resolved: '—', supported: '=', uncertain: '?' };
  function relBadge(status) {
    return h('span', { class: 'rel', 'data-status': status }, h('span', { class: 'mk', 'aria-hidden': 'true', text: REL_MARK[status] }), REL_TEXT[status]);
  }

  // Case board
  function renderBoard() {
    const unlocked = G.CARDS.filter((c) => state.unlocked.includes(c.id));
    view.append(
      h('div', { class: 'page-head' }, h('h1', { text: 'Case board' }),
        p('Choose any two items to see how they connect. Pin a connection to keep it. Nothing here changes your result. It is a place to check your own thinking.', 'lede')),
      h('div', { class: 'board-legend', 'aria-label': 'What the connection marks mean' },
        ['supported', 'uncertain', 'disputed', 'resolved'].map((s) => h('span', { class: 'lg' }, relBadge(s)))));
    const strings = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    strings.setAttribute('class', 'strings'); strings.setAttribute('aria-hidden', 'true'); strings.setAttribute('focusable', 'false');
    const wrap = h('div', { class: 'board-wrap' }, strings);
    sourceOrder.forEach((src) => {
      const cards = unlocked.filter((c) => c.source === src);
      if (!cards.length) return;
      wrap.append(h('section', { class: 'bgroup' }, h('h3', { text: ART.SOURCE_LABEL[src] }),
        h('div', { class: 'tiles' }, cards.map((c) => tileEl(c)))));
    });
    view.append(wrap, relationPanel());
    const pins = state.pins.map((k) => k.split('|')).filter(([a, b]) => G.relation(state, a, b));
    view.append(h('section', { class: 'pins' }, h('h2', { text: 'Pinned connections' }),
      pins.length ? h('ul', {}, pins.map(([a, b]) => {
        const r = G.relation(state, a, b);
        return h('li', { 'data-status': r.status },
          h('div', { class: 'pin-top' }, h('button', { type: 'button', class: 'linkbtn', on: { click: () => { boardSel = [a, b]; render(); } } }, G.cardById(a).title + '  ↔  ' + G.cardById(b).title), relBadge(r.status)),
          h('p', { text: r.why }),
          h('button', { type: 'button', class: 'btn quiet small', 'data-key': 'unpin-' + a + '-' + b, on: { click: () => { G.togglePin(state, a, b); persist(); render(); } } }, 'Unpin'));
      })) : p('Nothing pinned yet. Select two connected items and pin what you find.', 'quiet')));
  }

  function tileEl(card) {
    const m = ART.cardMeta(card); const cls = state.classes[card.id]; const i = boardSel.indexOf(card.id);
    return h('button', {
      type: 'button', class: 'tile', 'data-key': 'tile-' + card.id, 'data-cls': cls || 'none', 'data-kind': m.kind, 'data-sel': i >= 0 ? String(i + 1) : false,
      'aria-pressed': String(i >= 0), 'aria-label': card.title + '. ' + (cls ? CLASS_LABEL[cls] : 'Unclassified') + (i >= 0 ? '. Selected.' : ''),
      on: { click: () => selectTile(card.id) } },
      m.kind === 'testimony' ? h('img', { class: 'tile-face', src: ART.PEOPLE[m.speaker].img, alt: '', width: 360, height: 450 }) : h('span', { class: 'tile-mark', 'aria-hidden': 'true' }),
      h('span', { class: 'tile-kind', text: m.label }), h('span', { class: 'tile-title', text: card.title }),
      h('span', { class: 'tile-cls' }, badge(cls)), i >= 0 ? h('span', { class: 'tile-n', 'aria-hidden': 'true', text: String(i + 1) }) : null);
  }

  function selectTile(id) {
    const i = boardSel.indexOf(id);
    if (i >= 0) boardSel.splice(i, 1);
    else { boardSel.push(id); if (boardSel.length > 2) boardSel.shift(); }
    render();
  }

  function relationPanel() {
    const panel = h('section', { class: 'relation', 'aria-live': 'polite', 'aria-label': 'Connection between the selected items' });
    if (boardSel.length === 0) { panel.append(p('Select an item to begin.', 'quiet')); return panel; }
    const chip = (id) => h('button', { type: 'button', class: 'chip-card', 'data-key': 'rel-open-' + id, on: { click: () => openInspect(id, 'rel-open-' + id) } }, G.cardById(id).title);
    if (boardSel.length === 1) {
      const id = boardSel[0]; const rels = G.knownRelations(state).filter((r) => r.a === id || r.b === id);
      panel.append(...[h('div', { class: 'rel-head' }, chip(id), h('button', { type: 'button', class: 'btn quiet small', 'data-key': 'rel-clear', on: { click: () => { boardSel = []; render(); } } }, 'Clear')),
        p(rels.length ? 'Now choose a second item. The file records connections between this and:' : 'Choose a second item. The file records no connection from this one to anything you hold yet, but check.', 'quiet'),
        rels.length ? h('div', { class: 'row wrap' }, rels.map((r) => { const o = r.a === id ? r.b : r.a; return h('button', { type: 'button', class: 'btn quiet small', 'data-key': 'rel-pick-' + o, on: { click: () => selectTile(o) } }, G.cardById(o).title); })) : null].filter(Boolean));
      return panel;
    }
    const [a, b] = boardSel; const r = G.relation(state, a, b); const pinned = state.pins.includes(G.pairKey(a, b));
    panel.append(h('div', { class: 'rel-head' }, chip(a), h('span', { class: 'vs', 'aria-hidden': 'true', text: '↔' }), chip(b),
      h('button', { type: 'button', class: 'btn quiet small', 'data-key': 'rel-clear', on: { click: () => { boardSel = []; render(); } } }, 'Clear')));
    if (r) {
      panel.append(...[h('div', { class: 'rel-body', 'data-status': r.status }, relBadge(r.status), p(r.why)),
        r.status === 'uncertain' && r.kind === 'supports' ? p('This would be supported if both items were sorted as Fact. They are not both Fact yet.', 'quiet') : null,
        h('button', { type: 'button', class: 'btn', 'data-key': 'rel-pin', 'aria-pressed': String(pinned), on: { click: () => { G.togglePin(state, a, b); persist(); render(); } } }, pinned ? 'Unpin this connection' : 'Pin this connection')].filter(Boolean));
    } else {
      panel.append(p('The file records no connection between these two. Not every pair is connected.', 'rel-none'));
    }
    return panel;
  }

  function drawStrings() {
    const wrap = view.querySelector('.board-wrap'); if (!wrap) return;
    const svg = wrap.querySelector('svg.strings'); const wr = wrap.getBoundingClientRect();
    svg.setAttribute('width', wr.width); svg.setAttribute('height', wr.height); svg.setAttribute('viewBox', '0 0 ' + wr.width + ' ' + wr.height);
    svg.replaceChildren();
    const ns = 'http://www.w3.org/2000/svg';
    const centre = (id) => { const t = wrap.querySelector('[data-key="tile-' + id + '"]'); if (!t) return null; const r = t.getBoundingClientRect(); return [r.left + r.width / 2 - wr.left, r.top + 18 - wr.top]; };
    const line = (a, b, cls) => {
      const pa = centre(a), pb = centre(b); if (!pa || !pb) return;
      const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2 + Math.min(40, Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) * 0.12);
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M' + pa[0] + ' ' + pa[1] + ' Q' + mx + ' ' + my + ' ' + pb[0] + ' ' + pb[1]);
      path.setAttribute('class', 'str ' + cls); svg.append(path);
    };
    state.pins.forEach((k) => { const [a, b] = k.split('|'); const r = G.relation(state, a, b); if (r) line(a, b, r.status); });
    if (boardSel.length === 2) line(boardSel[0], boardSel[1], 'sel');
  }
  let resizeQueued = false;
  window.addEventListener('resize', () => {
    if (resizeQueued) return; resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; if (!showTitle && state.screen === 'board') drawStrings(); });
  });

  // Interviews
  function pips(src) {
    const t = state.trust[src];
    return h('span', { class: 'pips', role: 'img', 'aria-label': 'Trust ' + t + ' of 5' },
      [0, 1, 2, 3, 4].map((i) => h('span', { class: 'pip' + (i < t ? ' on' : ''), 'aria-hidden': 'true' })));
  }

  function renderInterviews() {
    view.append(h('div', { class: 'page-head' }, h('h1', { text: 'Interviews' })),
      h('div', { class: 'people', role: 'group', 'aria-label': 'Who to speak to' },
        Object.entries(G.INTERVIEWS).map(([id, iv]) => h('button', {
          type: 'button', 'data-key': 'who-' + id, 'aria-pressed': String(person === id),
          on: { click: () => { person = id; notice = null; render(); } },
        }, h('img', { class: 'chip-portrait', src: ART.PEOPLE[id].img, alt: '', width: 360, height: 450 }), h('span', { class: 'nm', text: iv.name })))));
    const iv = G.INTERVIEWS[person]; const pe = ART.PEOPLE[person];
    const theirCards = G.CARDS.filter((c) => c.source === person && state.unlocked.includes(c.id));
    const side = h('aside', { class: 'profile' },
      h('img', { class: 'profile-img', src: pe.img, alt: pe.alt, width: 360, height: 450 }),
      h('h2', { text: iv.name }), p(pe.tag, 'tag'),
      h('div', { class: 'trust' }, h('span', { class: 'lab', text: 'Trust' }), pips(person)),
      h('div', { class: 'theirs' }, h('h3', { text: 'In the file from them' }),
        theirCards.length ? h('ul', {}, theirCards.map((c) => h('li', {}, h('button', { type: 'button', class: 'linkbtn', 'data-key': 'pc-' + c.id, on: { click: () => openInspect(c.id, 'pc-' + c.id) } }, c.title), badge(state.classes[c.id]))))
          : p('Nothing yet. Ask a question.', 'quiet')));
    const talk = h('div', { class: 'talk', 'aria-live': 'polite' });
    const reply = (lines) => h('div', { class: 'reply' }, h('img', { class: 'avatar-img', src: pe.img, alt: '', width: 360, height: 450 }),
      h('div', { class: 'lines' }, lines.map((l) => line(l))));
    talk.append(h('div', { class: 'exch' }, ...splitLines(iv.intro).map((g) => g.speak ? reply(g.lines) : line('> ' + g.lines[0]))));
    state.asked.forEach((tid) => {
      const t = G.findTopic(person, tid);
      if (!t) return;
      talk.append(h('div', { class: 'exch' + (tid === latestTopic ? ' latest' : '') },
        h('p', { class: 'q', text: t.label }), ...splitLines(t.lines).map((g) => g.speak ? reply(g.lines) : line('> ' + g.lines[0]))));
    });
    const open = iv.topics.filter((t) => G.topicAvailable(state, person, t).ok);
    const main = h('div', { class: 'interview-main' });
    if (notice) main.append(h('div', { class: 'notice', role: 'status' }, notice));
    main.append(talk, h('h3', { text: open.length ? 'What do you ask?' : 'Nothing more to ask for now' }),
      h('div', { class: 'topics' }, open.map((t) => {
        const ref = t.requires && t.requires.card ? G.cardById(t.requires.card) : null;
        return h('div', { class: 'topic-row' },
          h('button', { type: 'button', class: 'topic', 'data-tone': t.tone || 'plain', 'data-key': 'ask-' + t.id, on: { click: () => askTopic(person, t.id) } },
            t.tone ? h('span', { class: 'tag', text: { press: 'Press', gentle: 'Gently', evidence: 'Show evidence' }[t.tone] }) : null, t.label),
          ref ? h('button', { type: 'button', class: 'ref', 'data-key': 'ref-' + t.id, on: { click: () => openInspect(ref.id, 'ref-' + t.id) } }, h('span', { class: 'k', text: 'Uses' }), ' ' + ref.title) : null);
      })));
    view.append(h('div', { class: 'interview' }, side, main));
  }

  // Group dialogue lines together; keep stage directions on their own.
  function splitLines(lines) {
    const out = [];
    lines.forEach((l) => {
      if (l.startsWith('>')) out.push({ speak: false, lines: [l.slice(1).trim()] });
      else if (out.length && out[out.length - 1].speak) out[out.length - 1].lines.push(l);
      else out.push({ speak: true, lines: [l] });
    });
    return out;
  }
  function line(l) { return l.startsWith('>') ? h('p', { class: 'n', text: l.slice(1).trim() }) : h('p', { class: 'a', text: l }); }

  function askTopic(src, topicId) {
    const r = G.ask(state, src, topicId);
    if (!r.ok) return;
    notice = r.gained.length ? 'Added to the file: ' + r.gained.map((id) => G.cardById(id).title).join('; ') + '.' : null;
    latestTopic = topicId;
    persist(); render();
  }

  // Places
  function renderPlaces() {
    const pl = ART.PLACES.find((x) => x.id === placeId) || ART.PLACES[0];
    view.append(h('div', { class: 'page-head' }, h('h1', { text: 'Places' }),
      p('The places the file mentions, with what the file says about each. Items you have not found yet are not listed.', 'lede')),
      h('div', { class: 'people places-tabs', role: 'group', 'aria-label': 'Choose a place' },
        ART.PLACES.map((x) => h('button', { type: 'button', 'data-key': 'place-' + x.id, 'aria-pressed': String(x.id === pl.id), on: { click: () => { placeId = x.id; render(); } } },
          h('img', { class: 'chip-place', src: x.img, alt: '', width: 1200, height: 675 }), h('span', { class: 'nm', text: x.name })))));
    const here = pl.cards.filter((id) => state.unlocked.includes(id));
    const missing = pl.cards.length - here.length;
    view.append(h('article', { class: 'place' },
      h('figure', { class: 'place-art' }, h('img', { src: pl.img, alt: pl.alt, width: 1200, height: 675 })),
      h('div', { class: 'place-copy' }, h('h2', { text: pl.name }), p(pl.text),
        h('h3', { text: 'In the file from here' }),
        here.length ? h('ul', { class: 'place-cards' }, here.map((id) => { const c = G.cardById(id); return h('li', {}, h('button', { type: 'button', class: 'linkbtn', 'data-key': 'pl-' + id, on: { click: () => openInspect(id, 'pl-' + id) } }, c.title), badge(state.classes[id])); }))
          : p('Nothing from here is in the file yet.', 'quiet'),
        missing > 0 ? p(missing + ' more ' + (missing === 1 ? 'item' : 'items') + ' tied to this place ' + (missing === 1 ? 'is' : 'are') + ' not in the file yet. Someone you have not asked may know.', 'quiet') : null,
        pl.people.length ? [h('h3', { text: 'People who speak of it' }),
          h('div', { class: 'row wrap' }, pl.people.map((id) => h('button', { type: 'button', class: 'btn quiet person', 'data-key': 'pp-' + id,
            on: { click: () => { person = id; go('interviews'); } } }, h('img', { class: 'chip-portrait', src: ART.PEOPLE[id].img, alt: '', width: 360, height: 450 }), ART.PEOPLE[id].name)))] : null)));
  }

  // Timeline
  function eventEl(id, time, label, cardId) {
    const unlocked = state.unlocked.includes(cardId); const cls = state.classes[cardId]; const open = tlOpen.has(id);
    const card = G.cardById(cardId);
    const li = h('li', { class: 'ev' + (open ? ' open' : ''), 'data-t': time },
      h('button', { type: 'button', class: 'ev-btn', 'data-key': 'ev-' + id, 'aria-expanded': String(open), 'aria-controls': 'evd-' + id,
        on: { click: () => { if (tlOpen.has(id)) tlOpen.delete(id); else tlOpen.add(id); render(); } } },
        h('span', { class: 't', text: time }), h('span', { class: 'lab', text: label }),
        h('span', { class: 'src', text: unlocked ? (cls ? 'Marked ' + CLASS_LABEL[cls] : 'Not yet classified') : 'Source not yet in the file' })),
      h('div', { class: 'ev-detail', id: 'evd-' + id, hidden: !open },
        unlocked ? [h('p', { class: 'ev-title', text: card.title }), p(card.text), h('div', { class: 'row' }, badge(cls),
          h('button', { type: 'button', class: 'btn quiet small', 'data-key': 'ev-ex-' + id, on: { click: () => openInspect(cardId, 'ev-ex-' + id) } }, 'Examine'))]
          : p('The source for this has not come into the file yet.', 'quiet')));
    return li;
  }

  function renderTimeline() {
    const T = G.TIMELINE;
    const T15 = G.FACTS.t2015;
    const past = [['p1', T15.photo, 'Photograph: ' + G.FACTS.boat + ' on its side', 'c01'], ['p2', T15.allSafe, '“All safe.” sent', 'c02'], ['p3', T15.firstCall, 'First call to the emergency line', 'c03'], ['p4', T15.recovery, 'Arlo Penn found, next morning', 'c05']];
    const mine = state.timeline && T.options.find((o) => o.id === state.timeline);
    const idx = (t) => T.events.findIndex((e) => e.t === t);
    const range = mine ? [idx(mine.from), idx(mine.to)] : null;
    const ok = mine ? G.timelineCorrect(state) : false;
    view.append(h('div', { class: 'page-head' }, h('h1', { text: 'The night, October 2016' }),
      p('What the file can place in time, and where each time comes from. Open an event to read its source. A time is only as good as its source.', 'lede')),
      h('div', { class: 'tl-wrap' },
        h('section', { class: 'tl-col' }, h('h2', { text: 'The evening in 2015' }), p('What the records place, in order.', 'quiet'),
          p(T.note2015, 'tl-note'),
          h('ol', { class: 'tl past' }, past.map(([id, t, label, cid]) => eventEl(id, t, label, cid)))),
        h('section', { class: 'tl-col' }, h('h2', { text: 'The vote night, 2016' }), p('The six times the file gives for the night of the vote.', 'quiet'),
          h('ol', { class: 'tl' + (mine ? ' answered ' + (ok ? 'right' : 'wrong') : '') },
            T.events.map((e, i) => { const li = eventEl('e' + i, e.t, e.label, e.card); if (range && i >= Math.min(...range) && i <= Math.max(...range)) li.classList.add('in-range'); return li; })),
          mine ? p('Marked: ' + mine.label + (ok ? '.' : ' (your answer).'), 'range-note') : null)),
      h('h2', { text: T.question }));
    const done = !!state.timeline;
    view.append(h('div', { class: 'opts' + (done ? ' done' : ''), role: 'radiogroup', 'aria-label': T.question }, T.options.map((o) =>
        h('label', {}, h('input', { type: 'radio', name: 'tl', value: o.id, checked: state.timeline === o.id, 'data-key': 'tl-' + o.id,
        on: { change: () => { G.answerTimeline(state, o.id); persist(); render(); } } }), o.label))));
    if (done) view.append(h('div', { class: 'explain' + (G.timelineCorrect(state) ? '' : ' bad') },
      p(G.timelineCorrect(state) ? 'Yes.' : 'Not quite. The stretch with no independent record is a different one.'), p(T.explain),
      p('Choose another option if you want to change your answer.', 'foot')));
    else view.append(p('Your answer is recorded when you choose.', 'foot'));
  }

  // Sign-off pages
  function renderPages() {
    const P = G.PAGES;
    view.append(h('div', { class: 'page-head' }, h('h1', { text: 'Pages' }),
      p('Everything of Nell’s that carries a sign-off, set beside the messages that reached Wren.', 'lede')),
      h('div', { class: 'specimens', role: 'list', 'aria-label': 'Sign-offs' }, P.samples.map((s) =>
        h('figure', { class: 'specimen', role: 'listitem' }, h('div', { class: 'spec-sign', text: s.sign }), h('figcaption', { text: s.label })))),
      h('h2', { text: P.question }));
    const done = !!state.pages;
    view.append(h('div', { class: 'opts' + (done ? ' done' : ''), role: 'radiogroup', 'aria-label': P.question }, P.options.map((o) =>
        h('label', {}, h('input', { type: 'radio', name: 'pg', value: o.id, checked: state.pages === o.id, 'data-key': 'pg-' + o.id,
        on: { change: () => { G.answerPages(state, o.id); persist(); render(); } } }), o.label))));
    if (done) {
      const msg = G.PAGES.feedback[G.PAGES.options.find((o) => o.id === state.pages).result];
      view.append(h('div', { class: 'explain' + (G.pagesCorrect(state) ? '' : ' bad') }, p(msg), p('Choose another option if you want to change your answer.', 'foot')));
    } else view.append(p('Your answer is recorded when you choose.', 'foot'));
  }

  // Verdicts
  const VERDICT_GLOSS = { TRUE: 'evidence supports it', FALSE: 'evidence contradicts it', NULL: 'not enough evidence' };

  function renderVerdicts() {
    const ruled = Object.keys(state.verdicts).length;
    view.append(h('div', { class: 'page-head' }, h('h1', { text: 'Verdicts' }),
      p('TRUE or FALSE must rest on cards you have sorted as Fact. NULL is for what the evidence cannot settle. It is not a place to put things that can be proved. You will see how the file read your answers at the end.', 'lede'),
      h('ul', { class: 'rules compact' }, ['TRUE', 'FALSE', 'NULL'].map((v) => h('li', { 'data-v': v }, h('span', { class: 'vw', text: v }), G.RULES[v].slice(v.length + 2)))),
      h('p', { class: 'tally', 'aria-live': 'polite', text: ruled + ' of ' + G.CLAIMS.length + ' claims ruled on' })));
    G.CLAIMS.forEach((c) => {
      const v = state.verdicts[c.id];
      const refs = (ART.CLAIM_CARDS[c.id] || []).filter((id) => state.unlocked.includes(id));
      view.append(h('article', { class: 'claim', 'data-ruled': v || false },
        h('p', { class: 'claim-text', text: c.text }),
        h('div', { class: 'claim-refs' }, h('span', { class: 'k', text: 'Cards about this' }),
          refs.length ? refs.map((id) => h('button', { type: 'button', class: 'chip-card', 'data-key': 'cr-' + c.id + '-' + id, on: { click: () => openInspect(id, 'cr-' + c.id + '-' + id) } },
            G.cardById(id).title, ' ', badge(state.classes[id]))) : h('span', { class: 'quiet', text: 'nothing yet' })),
        h('div', { class: 'verdicts', role: 'group', 'aria-label': 'Verdict: ' + c.text }, G.VERDICTS.map((x) => h('button', {
          type: 'button', 'data-key': 'v-' + c.id + '-' + x, 'data-v': x, 'aria-pressed': String(v === x),
          on: { click: () => { G.setVerdict(state, c.id, v === x ? null : x); persist(); render(); } } },
          h('span', { class: 'vw', text: x }), h('span', { class: 'vg', text: VERDICT_GLOSS[x] }))))));
    });
    view.append(h('hr', { class: 'rule' }), h('button', { class: 'btn', type: 'button', on: { click: () => go('retell') } }, 'Continue to the retelling'));
  }

  // Retelling
  function renderRetell() {
    view.append(h('div', { class: 'page-head' }, h('h1', { text: 'The retelling' }),
      p('Choose three sentences, and someone to say them to. Choose only what you can stand behind.', 'lede')));
    Object.entries(G.RETELL).forEach(([slot, grp]) => {
      view.append(h('fieldset', {}, h('legend', { text: grp.title }),
        h('div', { class: 'opts' }, grp.options.map((o) => h('label', {}, h('input', {
          type: 'radio', name: 'rt-' + slot, value: o.id, checked: state.retell[slot] === o.id, 'data-key': 'rt-' + o.id,
          on: { change: () => { G.chooseRetell(state, slot, o.id); persist(); render(); } } }), o.text)))));
    });
    view.append(h('fieldset', {}, h('legend', { text: 'Who do you say it to?' }),
      h('div', { class: 'opts addr' }, G.ADDRESSEES.map((a) => h('label', {}, h('input', {
        type: 'radio', name: 'addr', value: a.id, checked: state.addressee === a.id, 'data-key': 'ad-' + a.id,
        on: { change: () => { G.chooseAddressee(state, a.id); persist(); render(); } } }), a.label)))));
    // The sentence the player is about to commit to.
    const chosen = Object.entries(G.RETELL).map(([slot, grp]) => { const o = grp.options.find((x) => x.id === state.retell[slot]); return o ? o.text : null; }).filter(Boolean);
    const addr = G.ADDRESSEES.find((a) => a.id === state.addressee);
    const tally = { TRUE: 0, FALSE: 0, NULL: 0 }; Object.values(state.verdicts).forEach((v) => { tally[v]++; });
    const unjudged = G.CLAIMS.filter((c) => !state.verdicts[c.id]).length;
    const unclassified = state.unlocked.filter((id) => !state.classes[id]).length;
    view.append(h('section', { class: 'statement', 'aria-label': 'What you are about to say' },
      h('h2', { text: 'What you are about to say' }),
      chosen.length ? h('blockquote', {}, chosen.map((t) => p(t))) : p('Nothing chosen yet.', 'quiet'),
      addr ? p('To: ' + addr.label + '.', 'to') : null,
      h('ul', { class: 'stand' },
        h('li', { text: 'Ruled TRUE: ' + tally.TRUE + ' · FALSE: ' + tally.FALSE + ' · NULL: ' + tally.NULL }),
        unjudged ? h('li', { class: 'warn', text: unjudged + ' claim' + (unjudged === 1 ? '' : 's') + ' still open. A claim you have not ruled on counts for nothing.' }) : null,
        unclassified ? h('li', { class: 'warn', text: unclassified + ' card' + (unclassified === 1 ? '' : 's') + ' not yet sorted.' }) : null)));
    const checklist = G.endingChecklist(state);
    if (checklist) view.append(h('section', { class: 'ending-checklist', 'aria-label': checklist.title },
      h('h2', { text: checklist.title }),
      h('ul', {}, checklist.items.map((item) => h('li', { 'data-done': String(item.done) },
        h('span', { class: 'check', 'aria-hidden': 'true', text: item.done ? '✓' : '○' }), item.text)))));
    const ready = G.retellComplete(state);
    view.append(h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', disabled: !ready, on: { click: () => { G.resolveEnding(state); persist(); closeInspect(); render({ focusTop: true }); } } }, 'Say it and see the ending'),
      !ready ? h('span', { class: 'foot', text: 'Choose one sentence in each group, and who you say it to.' }) : null));
  }

  // Ending
  function explainEl() {
    const ex = G.explainEnding(state);
    return h('details', { class: 'explain-end', open: ex.lines.some((l) => l.kind !== 'ok') ? true : false },
      h('summary', { text: 'How the file read your answers (' + ex.supported + ' of ' + ex.total + ' claims backed)' }),
      h('ul', {}, ex.lines.map((l) => h('li', { 'data-kind': l.kind, text: l.text }))));
  }

  function renderEnding() {
    const e = G.ENDINGS[state.ending];
    if (!e) { state.screen = 'retell'; return renderRetell(); }
    const art = ART.ENDINGS[state.ending];
    view.append(h('article', { class: 'ending', 'data-tone': art.tone, 'data-ending': state.ending },
      h('figure', { class: 'ending-art' }, h('img', { src: art.img, alt: art.alt, width: 1200, height: 460 })),
      h('div', { class: 'ending-copy' },
        p(art.kicker, 'kicker'), h('h1', { text: e.title }),
        h('div', { class: 'ending-body' }, G.endingBody(state).map((t) => p(t))),
        explainEl(),
        h('div', { class: 'row' },
          h('button', { class: 'btn quiet', type: 'button', on: { click: () => go('evidence') } }, 'Reopen the file'),
          h('button', { class: 'btn', type: 'button', on: { click: startNew } }, 'Start again')),
        p('There are seven endings. Yours depends on what you checked, what you struck, what you ruled, and who you said it to.', 'foot'))));
  }

  document.getElementById('menu-btn').addEventListener('click', () => { closeInspect(); showTitle = true; confirmingNew = false; render({ focusTop: true }); });
  render({ focusTop: false });
})();
