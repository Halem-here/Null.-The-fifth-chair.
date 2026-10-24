/* Shared DOM helpers. Callers provide the game data; text is added as text nodes, never HTML. */
(function () {
  const G = window.NULLGAME;
  const ART = G.ART;
  const tr = (value) => G.t ? G.t(String(value)) : String(value);

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v === null || v === undefined) continue;
      if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
      else if (k === 'text') el.textContent = tr(v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, ['aria-label', 'aria-description', 'aria-valuetext', 'title', 'alt', 'placeholder'].includes(k) ? tr(v) : v);
    }
    kids.flat(Infinity).forEach((c) => { if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(tr(c))); });
    return el;
  }
  const p = (text, cls) => h('p', { class: cls }, text);

  const CLASS_LABEL = { fact: 'Fact', told: 'Told', guessed: 'Guessed', struck: 'Struck' };
  // The class is carried by text, border style and a mark, never by colour alone.
  const CLASS_MARK = { fact: '■', told: '▤', guessed: '◌', struck: '✕' };

  function badge(cls, extra) {
    return h('span', { class: 'badge', 'data-cls': cls || 'none', title: cls ? ART.CLASS_MEANING[cls] : 'Not classified yet' },
      h('span', { class: 'mk', 'aria-hidden': 'true', text: cls ? CLASS_MARK[cls] : '○' }), cls ? CLASS_LABEL[cls] : 'Unclassified', extra || null);
  }

  function portrait(id, cls) {
    const pe = ART.PEOPLE[id];
    return h('img', { class: cls || 'portrait', src: pe.img, alt: pe.alt, width: 360, height: 450, decoding: 'async' });
  }

  const SIGN_FONT = 'script';

  // Draw each evidence type using the card’s own text.
  function artifact(card, opts) {
    const m = ART.cardMeta(card);
    const big = !!(opts && opts.big);
    const wrap = h('div', { class: 'art art-' + m.kind + (big ? ' big' : ''), 'data-kind': m.kind });
    const text = (cls) => h('p', { class: cls || 'art-text', text: card.text });

    switch (m.kind) {
      case 'photo':
        wrap.append(h('figure', { class: 'photo' + (opts && opts.zoomed ? ' zoomed' : '') },
          h('div', { class: 'photo-frame' }, h('img', { src: m.img, alt: m.alt, width: 800, height: 600, decoding: 'async' })),
          h('figcaption', {}, text('art-text'))));
        break;
      case 'message':
        wrap.append(h('div', { class: 'phone' },
          h('div', { class: 'phone-top' }, h('span', { text: m.inbound ? 'From: unknown sender' : 'To: ' + m.to }), h('span', { text: m.when })),
          h('div', { class: 'bubble ' + (m.inbound ? 'in' : 'out') }, text()),
          m.meta ? h('div', { class: 'phone-foot', text: m.meta }) : null));
        break;
      case 'log':
        wrap.append(h('div', { class: 'log' },
          h('div', { class: 'log-head' }, h('span', { text: m.head[0] }), h('span', { text: m.head[1] })),
          h('div', { class: 'log-rule', 'aria-hidden': 'true' }), text('art-text mono')));
        break;
      case 'statement':
        wrap.append(h('div', { class: 'form' }, h('div', { class: 'form-head', text: m.head }), text()));
        break;
      case 'post':
        wrap.append(h('div', { class: 'post' },
          h('div', { class: 'post-top' }, h('span', { class: 'avatar', 'aria-hidden': 'true' }), h('span', { class: 'user', text: m.user }), h('span', { class: 'when', text: m.when })),
          text()));
        break;
      case 'notebook':
        wrap.append(h('div', { class: 'notebook' }, h('div', { class: 'nb-date', text: m.when }), text('art-text hand')));
        break;
      case 'handwritten':
        wrap.append(h('div', { class: 'page' }, text('art-text hand')));
        break;
      case 'vote': {
        const votes = [...card.text.matchAll(/\b(Dess|Corin|Teo|Livia|Nell) (TRUE|FALSE|NULL)\b/g)].map((x) => [x[1], x[2]]);
        wrap.append(h('div', { class: 'vote' },
          h('div', { class: 'vote-head', text: 'VOTE SHEET' }),
          h('div', { class: 'vote-table', role: 'table', 'aria-label': 'The five votes' },
            votes.map(([who, v]) => h('div', { class: 'vote-row', role: 'row' }, h('span', { class: 'who', role: 'cell', text: who }), h('span', { class: 'v', 'data-v': v, role: 'cell', text: v })))),
          text('art-text small')));
        break;
      }
      case 'compare':
        wrap.append(h('div', { class: 'compare' },
          h('div', { class: 'cmp-col' }, h('span', { class: 'cmp-lab', text: 'Nell’s pages and texts' }), h('span', { class: 'cmp-sign', text: '-- N.' })),
          h('div', { class: 'cmp-col' }, h('span', { class: 'cmp-lab', text: 'The messages to Wren' }), h('span', { class: 'cmp-sign', text: '-- N' }))),
          text());
        break;
      case 'sim':
        wrap.append(h('figure', { class: 'sim' }, h('img', { src: m.img, alt: m.alt, width: 400, height: 260, decoding: 'async' }), h('figcaption', {}, text())));
        break;
      case 'testimony': {
        const who = ART.PEOPLE[m.speaker];
        wrap.append(h('div', { class: 'speech' },
          h('img', { class: 'avatar-img', src: who.img, alt: '', width: 360, height: 450 }),
          h('div', { class: 'speech-body' }, h('span', { class: 'speaker', text: who.name }), h('blockquote', {}, text('art-text quote')))));
        break;
      }
      default:
        wrap.append(text());
    }
    return wrap;
  }

  function provenance(m) {
    return h('span', { class: 'prov', 'data-from': m.from, text: m.from === 'record' ? 'Record' : 'Account' });
  }

  window.NULLUI = { h, p, CLASS_LABEL, CLASS_MARK, badge, portrait, artifact, provenance, SIGN_FONT };
})();
