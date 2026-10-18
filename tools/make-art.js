#!/usr/bin/env node
/* Draw the SVG artwork in ../assets. Run: node tools/make-art.js
 * Seeded shapes keep each run identical. The evidence images follow the records:
 * the 20:41 photo shows MIST capsized; the 01:15 frame shows an empty dock.
 * Neither image identifies Nell, who untied MIST, or who sent Wren’s messages.
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets');

function write(rel, s) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s);
}
function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const f1 = (n) => Math.round(n * 10) / 10;

const GRAIN = (id, freq = 0.8) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>`;

function svg(w, h, body, { vign = 0.6, grain = 0.13, title = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">${title ? `<title>${title}</title>` : ''}
<defs>${GRAIN('gr')}<radialGradient id="vg" cx="50%" cy="48%" r="75%"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${vign}"/></radialGradient></defs>
${body}
<rect width="${w}" height="${h}" fill="url(#vg)"/>
<rect width="${w}" height="${h}" filter="url(#gr)" opacity="${grain}"/>
</svg>`;
}

// Portraits
const HEAD = 'M180 98 C 218 98 242 128 240 170 C 238 214 214 248 180 252 C 146 248 122 214 120 170 C 118 128 142 98 180 98Z';
const SHOULDERS = 'M30 450 C 40 336 108 292 180 292 C 252 292 320 336 330 450Z';

const HAIR = {
  long: (c) => ({
    back: `<path d="M110 150 C 94 226 92 306 110 352 L 250 352 C 268 306 266 226 250 150 C 244 96 116 96 110 150Z" fill="${c}"/>`,
    front: `<path d="M118 160 C 124 108 168 90 202 98 C 236 106 250 132 244 168 C 224 130 170 122 118 160Z" fill="${c}"/>` }),
  bun: (c) => ({
    back: `<circle cx="180" cy="86" r="24" fill="${c}"/>`,
    front: `<path d="M120 164 C 118 108 148 92 180 92 C 214 92 242 108 240 164 C 214 124 148 124 120 164Z" fill="${c}"/>` }),
  short: (c) => ({
    back: '',
    front: `<path d="M118 160 C 114 104 146 86 184 88 C 220 88 248 106 242 160 C 228 130 206 120 176 122 C 150 122 128 134 118 160Z" fill="${c}"/>` }),
  curly: (c) => {
    const r = rng(11); let s = '';
    for (let i = 0; i < 26; i++) { const a = Math.PI + (i / 25) * Math.PI; const rx = 66 + r() * 12, ry = 84 + r() * 12; s += `<circle cx="${f1(180 + Math.cos(a) * rx)}" cy="${f1(168 + Math.sin(a) * ry)}" r="${f1(15 + r() * 9)}" fill="${c}"/>`; }
    for (let i = 0; i < 8; i++) s += `<circle cx="${f1(124 + r() * 112)}" cy="${f1(104 + r() * 26)}" r="${f1(14 + r() * 8)}" fill="${c}"/>`;
    return { back: s, front: '' };
  },
  wavy: (c) => ({
    back: `<path d="M112 152 C 92 210 98 270 120 306 C 142 286 120 252 130 222 L 230 222 C 240 252 218 286 240 306 C 262 270 268 210 248 152 C 244 98 118 98 112 152Z" fill="${c}"/>`,
    front: `<path d="M120 164 C 126 110 168 92 204 100 C 238 108 248 134 242 168 C 226 134 176 122 120 164Z" fill="${c}"/>` }),
  bob: (c) => ({
    back: `<path d="M114 150 C 102 204 108 240 124 254 L 236 254 C 252 240 258 204 246 150 C 240 98 120 98 114 150Z" fill="${c}"/>`,
    front: `<path d="M120 160 C 122 110 150 94 180 94 C 212 94 240 110 240 160 C 222 140 198 138 180 142 C 160 138 138 140 120 160Z" fill="${c}"/>` }),
};

const PEOPLE = {
  nell: { skin: '#caa88e', hair: '#1c1613', style: 'long', cloth: '#2b2724', accent: '#8e2b2a', bg: ['#4a4036', '#0f0e0d'], mood: 'still',
    extra: (o) => `<path d="M126 286 C 150 316 210 316 234 286 L 246 322 C 214 346 146 346 114 322Z" fill="${o.accent}" opacity=".85"/><path d="M180 304 L 168 372 L 196 372Z" fill="#6e1f1e" opacity=".9"/>`,
    prop: () => `<text x="326" y="432" text-anchor="end" font-family="'Segoe Script','Bradley Hand','Brush Script MT',cursive" font-size="30" fill="#d9d1c0" opacity=".7">-- N.</text>` },
  dess: { skin: '#b9917a', hair: '#201a16', style: 'bun', cloth: '#26282a', accent: '#b69a5e', bg: ['#4d4430', '#0e0d0b'], mood: 'composed',
    extra: () => `<path d="M140 292 L 180 352 L 220 292 L 206 292 L 180 330 L 154 292Z" fill="#d9d1c0" opacity=".9"/><path d="M148 292 L 180 340 L 212 292 L 180 296Z" fill="#14120f"/>`,
    prop: () => `<g><rect x="38" y="392" width="150" height="70" rx="3" fill="#cdbf9c" transform="rotate(-4 100 420)"/><rect x="38" y="384" width="54" height="14" rx="3" fill="#b9aa86" transform="rotate(-4 100 420)"/><rect x="52" y="412" width="110" height="2" fill="#8a7d60" opacity=".7" transform="rotate(-4 100 420)"/><rect x="52" y="424" width="90" height="2" fill="#8a7d60" opacity=".7" transform="rotate(-4 100 420)"/></g>` },
  corin: { skin: '#d0b09a', hair: '#3a2f27', style: 'short', cloth: '#30332e', accent: '#7c8068', bg: ['#3d413b', '#0e0e0d'], mood: 'guarded', glasses: true,
    extra: () => `<path d="M138 292 L 180 334 L 222 292 L 206 292 L 180 318 L 154 292Z" fill="#cfc6b2" opacity=".85"/><path d="M180 334 L 180 450" stroke="#1a1b18" stroke-width="3" opacity=".7"/><circle cx="180" cy="372" r="4" fill="#14150f"/><circle cx="180" cy="404" r="4" fill="#14150f"/>`,
    prop: () => `<g transform="rotate(3 280 420)"><rect x="196" y="398" width="150" height="70" rx="2" fill="#c9b982"/><rect x="196" y="398" width="150" height="9" fill="#8a2d2c" opacity=".85"/><rect x="196" y="412" width="150" height="52" fill="#d8caa0"/></g>` },
  teo: { skin: '#b58968', hair: '#2a1f18', style: 'curly', cloth: '#3a3733', accent: '#8a7a5e', bg: ['#40382d', '#0e0d0b'], mood: 'tired', stubble: true,
    extra: () => `<path d="M104 330 C 120 300 150 292 180 292 C 210 292 240 300 256 330 L 262 450 L 98 450Z" fill="#46423d" opacity=".6"/><path d="M158 292 C 160 330 156 356 150 400" stroke="#d9d1c0" stroke-width="3" fill="none" opacity=".6"/><path d="M202 292 C 200 330 204 356 210 400" stroke="#d9d1c0" stroke-width="3" fill="none" opacity=".6"/>`,
    prop: () => `<g><rect x="258" y="396" width="64" height="66" rx="8" fill="#c8bfae"/><path d="M322 410 C 346 410 346 444 322 444" stroke="#c8bfae" stroke-width="8" fill="none"/><ellipse cx="290" cy="397" rx="30" ry="6" fill="#2a1d14"/><path d="M280 380 C 272 366 292 358 284 344" stroke="#d9d1c0" stroke-width="3" fill="none" opacity=".35"/><path d="M298 382 C 290 368 310 360 302 346" stroke="#d9d1c0" stroke-width="3" fill="none" opacity=".25"/></g>` },
  livia: { skin: '#9c7258', hair: '#3b2a22', style: 'wavy', cloth: '#4a3a32', accent: '#b0794f', bg: ['#5a4030', '#120d0a'], mood: 'warm',
    extra: () => `<path d="M138 292 C 150 332 210 332 222 292 L 236 450 L 124 450Z" fill="#33292a" opacity=".55"/><path d="M146 292 L 180 346 L 214 292" stroke="#2a201b" stroke-width="5" fill="none"/>`,
    prop: () => `<g><ellipse cx="80" cy="442" rx="84" ry="26" fill="#d4ccbb"/><ellipse cx="80" cy="440" rx="62" ry="17" fill="#bdb4a2"/><circle cx="62" cy="436" r="9" fill="#8e5a3a"/><circle cx="90" cy="440" r="8" fill="#6e7a52"/></g>` },
  wren: { skin: '#d0ad98', hair: '#241b17', style: 'bob', cloth: '#2c2b29', accent: '#9a3b36', bg: ['#34312d', '#0d0d0c'], mood: 'tense', young: true,
    extra: () => `<path d="M132 292 C 148 322 212 322 228 292 L 232 330 C 208 346 152 346 128 330Z" fill="#4a4743" opacity=".9"/>`,
    prop: () => `<g><path d="M270 330 L 360 450 L 190 450Z" fill="#d9d1c0" opacity=".07"/><rect x="262" y="372" width="54" height="92" rx="8" fill="#16161a" transform="rotate(10 290 420)"/><rect x="268" y="380" width="42" height="76" rx="4" fill="#d8d2c0" opacity=".85" transform="rotate(10 290 420)"/><rect x="274" y="392" width="30" height="5" fill="#2a2724" opacity=".5" transform="rotate(10 290 420)"/><rect x="274" y="404" width="22" height="5" fill="#2a2724" opacity=".4" transform="rotate(10 290 420)"/></g>` },
};

function portrait(id) {
  const o = PEOPLE[id];
  const h = HAIR[o.style](o.hair);
  const eyeA = o.mood === 'tired' ? 0.5 : 0.62;
  const mouth = { still: 'M166 228 L 194 228', composed: 'M166 227 C 176 229 188 229 194 226', guarded: 'M168 228 L 192 227', tired: 'M167 229 C 176 226 186 226 193 229', warm: 'M164 226 C 174 233 188 233 196 225', tense: 'M168 229 C 178 226 186 226 192 229' }[o.mood];
  let s = `<rect width="360" height="450" fill="url(#bg)"/><rect x="40" y="40" width="280" height="250" fill="#e8d9b0" opacity=".05"/>`;
  s += h.back;
  s += `<path d="${SHOULDERS}" fill="${o.cloth}"/>`;
  s += `<path d="${SHOULDERS}" fill="url(#fl)"/>`;
  s += o.extra(o);
  s += `<path d="M154 236 L 206 236 L 214 296 C 196 312 164 312 146 296Z" fill="${o.skin}"/><path d="M154 236 L 206 236 L 208 262 C 190 272 170 272 152 262Z" fill="#000" opacity=".28"/>`;
  s += `<path d="${HEAD}" fill="${o.skin}"/>`;
  if (o.stubble) { const r = rng(5); for (let i = 0; i < 90; i++) { const x = 130 + r() * 100, y = 200 + r() * 48; if (((x - 180) ** 2) / 3600 + ((y - 180) ** 2) / 6400 < 1) s += `<circle cx="${f1(x)}" cy="${f1(y)}" r=".9" fill="#1c140f" opacity=".55"/>`; } }
  s += `<path d="${HEAD}" fill="url(#fl)"/>`;
  s += h.front;
  // Keep the facial features subtle; the lighting carries most of the detail.
  s += `<g opacity="${eyeA}"><ellipse cx="154" cy="174" rx="8" ry="2.6" fill="#120d0a"/><ellipse cx="206" cy="174" rx="8" ry="2.6" fill="#120d0a"/><path d="M142 162 C 150 157 160 157 166 161" stroke="#120d0a" stroke-width="3" fill="none"/><path d="M194 161 C 200 157 210 157 218 162" stroke="#120d0a" stroke-width="3" fill="none"/></g>`;
  s += `<path d="M181 176 C 178 192 174 204 172 210 C 176 214 186 214 190 210" stroke="#120d0a" stroke-width="2.4" fill="none" opacity=".4"/>`;
  s += `<path d="${mouth}" stroke="#2a110e" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/>`;
  if (o.glasses) s += `<g fill="none" stroke="#14120f" stroke-width="3" opacity=".9"><circle cx="154" cy="174" r="17"/><circle cx="206" cy="174" r="17"/><path d="M171 172 C 176 168 184 168 189 172"/><path d="M137 170 L 124 164"/><path d="M223 170 L 236 164"/></g>`;
  if (o.young) s += `<circle cx="196" cy="206" r="1.4" fill="#5a3a2c" opacity=".5"/>`;
  s += o.prop();
  // Add the final light wash.
  s += `<rect width="360" height="450" fill="url(#wash)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 450" width="360" height="450" preserveAspectRatio="xMidYMid slice">
<defs>${GRAIN('gr', 0.9)}
<radialGradient id="bg" cx="30%" cy="22%" r="95%"><stop offset="0" stop-color="${o.bg[0]}"/><stop offset="1" stop-color="${o.bg[1]}"/></radialGradient>
<linearGradient id="fl" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".66"/></linearGradient>
<radialGradient id="wash" cx="50%" cy="42%" r="78%"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></radialGradient></defs>
${s}
<rect width="360" height="450" filter="url(#gr)" opacity=".16"/></svg>`;
}

// Landscapes
function sky(w, h, horizon, top, mid, glow) {
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".7" stop-color="${mid}"/><stop offset="1" stop-color="${glow}"/></linearGradient></defs><rect width="${w}" height="${horizon}" fill="url(#sky)"/>`;
}
function water(w, h, y, top, bot, seed = 3, streak = '#d9d1c0') {
  const r = rng(seed);
  let s = `<defs><linearGradient id="wt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs><rect y="${y}" width="${w}" height="${h - y}" fill="url(#wt)"/>`;
  for (let i = 0; i < 40; i++) { const yy = y + 6 + r() * (h - y - 10), x = r() * w, len = 30 + r() * 150; s += `<rect x="${f1(x)}" y="${f1(yy)}" width="${f1(len)}" height="${f1(1 + r() * 1.6)}" fill="${streak}" opacity="${f1(0.03 + r() * 0.08)}"/>`; }
  return s;
}
function hills(w, y, color, amp, seed, step = 70) {
  const r = rng(seed); let d = `M0 ${y}`;
  for (let x = 0; x <= w + step; x += step) d += ` L ${x} ${f1(y - 8 - r() * amp)}`;
  return `<path d="${d} L ${w} ${y + 4} L 0 ${y + 4}Z" fill="${color}"/>`;
}
function fog(w, y, hh, op = 0.18, color = '#c9c3b4') {
  return `<defs><linearGradient id="fg${y}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".5" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><rect y="${y}" width="${w}" height="${hh}" fill="url(#fg${y})"/>`;
}
function trees(w, y, count, seed, color, hMin = 80, hMax = 190) {
  const r = rng(seed); let s = '';
  for (let i = 0; i < count; i++) { const x = r() * w, hh = hMin + r() * (hMax - hMin), ww = hh * 0.34; s += `<path d="M${f1(x)} ${y} L ${f1(x - ww)} ${y} L ${f1(x - ww * 0.15)} ${f1(y - hh * 0.55)} L ${f1(x - ww * 0.7)} ${f1(y - hh * 0.55)} L ${f1(x)} ${f1(y - hh)} L ${f1(x + ww * 0.7)} ${f1(y - hh * 0.55)} L ${f1(x + ww * 0.15)} ${f1(y - hh * 0.55)} L ${f1(x + ww)} ${y}Z" fill="${color}"/>`; }
  return s;
}
function chair(x, y, s = 1, fill = '#14110f', lit = '') { // frontal chair silhouette, origin = floor centre
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-17" y="-92" width="34" height="58" rx="3" fill="${fill}"/><rect x="-21" y="-38" width="42" height="9" rx="2" fill="${fill}"/><rect x="-18" y="-30" width="5" height="30" fill="${fill}"/><rect x="13" y="-30" width="5" height="30" fill="${fill}"/>${lit}</g>`;
}
function windowLit(x, y, w, h, op = 1) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e2b66a" opacity="${op}"/><rect x="${x + w / 2 - 1.5}" y="${y}" width="3" height="${h}" fill="#17130f"/><rect x="${x}" y="${y + h / 2 - 1.5}" width="${w}" height="3" fill="#17130f"/>`;
}

function hero() {
  const W = 1600, H = 900, r = rng(21);
  let s = sky(W, 560, 560, '#070707', '#1b1a18', '#3a3530');
  s += `<defs><radialGradient id="mg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d9d1c0" stop-opacity=".5"/><stop offset="1" stop-color="#d9d1c0" stop-opacity="0"/></radialGradient></defs><circle cx="1130" cy="190" r="170" fill="url(#mg)"/><circle cx="1130" cy="190" r="34" fill="#d9d1c0" opacity=".92"/>`;
  for (let i = 0; i < 5; i++) s += `<rect x="${f1(r() * 1200)}" y="${f1(120 + r() * 320)}" width="${f1(280 + r() * 420)}" height="${f1(5 + r() * 9)}" rx="5" fill="#0c0b0a" opacity="${f1(0.4 + r() * 0.3)}"/>`;
  s += hills(W, 560, '#10100f', 60, 4, 90) + hills(W, 564, '#0a0a09', 34, 9, 55);
  s += water(W, H, 560, '#2b2a26', '#0a0a09', 5);
  // House on the right.
  s += `<g><path d="M930 560 L 930 372 L 1130 308 L 1330 372 L 1330 560Z" fill="#0b0a09"/><path d="M910 376 L 1130 296 L 1350 376 L 1350 392 L 1130 314 L 910 392Z" fill="#050504"/><rect x="1226" y="270" width="34" height="80" fill="#050504"/>`;
  s += windowLit(960, 420, 52, 70, .85) + windowLit(1250, 420, 52, 70, .7) + windowLit(1100, 440, 70, 52, .45);
  s += `<rect x="1020" y="404" width="200" height="130" fill="#1a1410"/><rect x="1028" y="412" width="184" height="114" fill="#e2b66a" opacity=".9"/>`; // big window
  s += `<rect x="1028" y="412" width="184" height="114" fill="url(#wl)"/><defs><radialGradient id="wl" cx="50%" cy="60%" r="70%"><stop offset="0" stop-color="#f3d79a" stop-opacity=".5"/><stop offset="1" stop-color="#6e3b18" stop-opacity=".55"/></radialGradient></defs>`;
  s += `<rect x="1036" y="480" width="168" height="8" fill="#2a1b10"/>`; // table
  for (let i = 0; i < 5; i++) s += `<rect x="${1046 + i * 32}" y="${i === 2 ? 452 : 458}" width="18" height="${i === 2 ? 36 : 30}" rx="2" fill="#241810"/>`;
  s += `<rect x="1118" y="404" width="4" height="122" fill="#1a1410"/></g>`;
  // Reflections on the water.
  s += `<g opacity=".5">${[[986, 56], [1276, 44], [1130, 90]].map(([x, w]) => `<rect x="${x}" y="566" width="${w * .25}" height="90" fill="#e2b66a" opacity=".16"/>`).join('')}</g>`;
  s += `<rect x="1090" y="566" width="80" height="130" fill="#e2b66a" opacity=".12"/>`;
  // Dock and its dim red lamp.
  s += `<path d="M0 650 L 760 612 L 780 626 L 0 700Z" fill="#070605"/><rect x="740" y="560" width="14" height="76" fill="#070605"/><circle cx="747" cy="556" r="9" fill="#8e2b2a"/><circle cx="747" cy="556" r="42" fill="#8e2b2a" opacity=".16"/>`;
  for (let i = 0; i < 18; i++) s += `<rect x="${i * 42}" y="${f1(656 - i * 2.2)}" width="2" height="${f1(34 - i)}" fill="#1b1815" opacity=".8"/>`;
  s += fog(W, 520, 150, .2) + fog(W, 640, 140, .13);
  s += `<rect y="780" width="${W}" height="120" fill="#050505" opacity=".55"/>`;
  return svg(W, H, s, { vign: 0.75, grain: 0.15, title: 'A lake house at night, one window lit, five chairs at a table.' });
}

function greywater() {
  const W = 1200, H = 675, r = rng(31);
  let s = sky(W, 330, 330, '#1c1c1b', '#34332f', '#5a574f');
  s += hills(W, 330, '#1b1b19', 54, 6, 80) + hills(W, 336, '#121211', 28, 12, 50);
  s += water(W, H, 332, '#3a3935', '#161614', 8);
  s += fog(W, 300, 70, .22);
  s += `<path d="M0 470 C 180 440 380 470 640 452 C 880 436 1040 466 1200 450 L 1200 675 L 0 675Z" fill="#1e1d1a"/>`;
  s += `<path d="M0 520 C 200 500 420 530 700 512 C 900 500 1060 520 1200 510 L 1200 675 L 0 675Z" fill="#161513"/>`;
  for (let i = 0; i < 160; i++) { const y = 470 + r() * 205, x = r() * W, rx = 6 + r() * 20 * (y - 440) / 235, ry = rx * (0.45 + r() * 0.2), c = ['#4a4741', '#3a3833', '#5a564d', '#2a2824'][Math.floor(r() * 4)]; s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${c}" opacity=".85"/>`; }
  s += `<path d="M120 560 C 260 540 380 548 520 566 L 516 578 C 380 562 260 556 124 578Z" fill="#0d0c0a"/><path d="M360 548 L 330 520 M420 552 L 450 524" stroke="#0d0c0a" stroke-width="7"/>`; // driftwood
  s += `<circle cx="840" cy="372" r="7" fill="#8e2b2a"/><rect x="838" y="372" width="4" height="12" fill="#0d0c0a"/>`; // buoy
  return svg(W, H, s, { vign: 0.7, title: 'Greywater beach, grey stones, still water.' });
}

function house() {
  const W = 1200, H = 675, r = rng(41);
  let s = sky(W, 470, 470, '#080808', '#1a1917', '#37332d');
  s += `<defs><radialGradient id="mg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d9d1c0" stop-opacity=".35"/><stop offset="1" stop-color="#d9d1c0" stop-opacity="0"/></radialGradient></defs><circle cx="190" cy="120" r="110" fill="url(#mg)"/><circle cx="190" cy="120" r="22" fill="#d9d1c0" opacity=".85"/>`;
  s += hills(W, 470, '#0f0f0e', 50, 14, 80);
  s += trees(W, 520, 14, 3, '#070706', 120, 280);
  s += `<rect y="470" width="${W}" height="205" fill="#0a0a09"/>`;
  s += `<path d="M330 520 L 330 280 L 600 200 L 870 280 L 870 520Z" fill="#12100e"/><path d="M300 288 L 600 188 L 900 288 L 900 306 L 600 208 L 300 306Z" fill="#070605"/><rect x="740" y="160" width="40" height="96" fill="#070605"/>`;
  s += `<rect x="330" y="372" width="540" height="10" fill="#070605"/>`;
  s += windowLit(380, 310, 70, 52, .22) + windowLit(750, 310, 70, 52, .22) + windowLit(380, 420, 80, 64, .95) + windowLit(740, 420, 80, 64, .9) + windowLit(560, 300, 80, 56, .18);
  s += `<rect x="552" y="410" width="96" height="110" fill="#070605"/><rect x="560" y="418" width="80" height="102" fill="#1b130d"/><circle cx="628" cy="472" r="3.5" fill="#b69a5e"/>`;
  s += `<path d="M520 520 L 530 500 L 670 500 L 680 520Z" fill="#0b0a08"/><path d="M540 520 L 560 600 L 640 600 L 660 520Z" fill="#1c1a16" opacity=".8"/>`;
  s += `<path d="M560 600 C 540 640 480 664 380 675 L 820 675 C 720 664 660 640 640 600Z" fill="#141310"/>`;
  s += fog(W, 500, 110, .16);
  return svg(W, H, s, { vign: 0.75, title: 'The Hartwell house from the path, lit windows.' });
}

function dock() {
  const W = 1200, H = 675, r = rng(51);
  let s = sky(W, 300, 300, '#0b0b0a', '#222120', '#44403a');
  s += hills(W, 300, '#141413', 40, 17, 70);
  s += water(W, H, 300, '#2c2b28', '#0d0d0c', 9);
  s += fog(W, 270, 70, .22);
  // Boat shed on the left bank.
  s += `<path d="M0 330 L 0 600 L 330 600 L 330 330 L 165 262Z" fill="#0f0e0c" opacity="0"/><path d="M0 440 L 0 330 L 120 290 L 250 330 L 250 440Z" fill="#0c0b09"/><rect x="92" y="372" width="76" height="68" fill="#1d1812"/><rect x="0" y="440" width="260" height="12" fill="#060605"/>`;
  // Dock seen in perspective.
  s += `<path d="M360 675 L 560 330 L 650 330 L 880 675Z" fill="#171512"/><path d="M360 675 L 560 330 L 572 330 L 394 675Z" fill="#0a0907"/><path d="M880 675 L 650 330 L 638 330 L 846 675Z" fill="#0a0907"/>`;
  for (let i = 0; i < 16; i++) { const t = i / 15, y = 336 + Math.pow(t, 1.6) * 338, xl = 560 - (560 - 360) * Math.pow(t, 1.6), xr = 650 + (880 - 650) * Math.pow(t, 1.6); s += `<line x1="${f1(xl)}" y1="${f1(y)}" x2="${f1(xr)}" y2="${f1(y)}" stroke="#050504" stroke-width="${f1(1 + t * 3)}"/>`; }
  // Lamp post.
  s += `<rect x="852" y="360" width="30" height="270" fill="#080705"/><rect x="846" y="352" width="42" height="14" fill="#14110d"/><rect x="858" y="322" width="18" height="30" fill="#1b1814"/><circle cx="867" cy="334" r="9" fill="#8e2b2a"/><circle cx="867" cy="334" r="70" fill="#8e2b2a" opacity=".14"/>`;
  s += `<rect x="560" y="320" width="14" height="40" fill="#080705"/>`;
  s += fog(W, 540, 120, .12);
  return svg(W, H, s, { vign: 0.7, title: 'The dock, the post, the water.' });
}

function eastshore() {
  const W = 1200, H = 675, r = rng(61);
  let s = sky(W, 360, 360, '#3c3b38', '#7b776d', '#aaa292');
  s += `<circle cx="640" cy="352" r="150" fill="#d9d1c0" opacity=".12"/>`;
  s += hills(W, 360, '#47453f', 40, 3, 90) + hills(W, 366, '#34332f', 22, 8, 60);
  s += water(W, H, 362, '#8b877b', '#3b3a36', 13, '#efe8d8');
  s += fog(W, 330, 90, .4, '#d9d1c0');
  s += `<path d="M0 560 C 250 530 500 570 800 540 C 1000 524 1100 550 1200 540 L 1200 675 L 0 675Z" fill="#1c1b18"/>`;
  for (let i = 0; i < 150; i++) { const x = r() * W, base = 560 + r() * 110, hh = 80 + r() * 190, bend = (r() - 0.5) * 60; s += `<path d="M${f1(x)} ${f1(base)} Q ${f1(x + bend * .3)} ${f1(base - hh * .6)} ${f1(x + bend)} ${f1(base - hh)}" stroke="#0e0d0b" stroke-width="${f1(1.5 + r() * 2.2)}" fill="none" opacity=".92"/>`; }
  s += fog(W, 500, 110, .22, '#cfc8b8');
  return svg(W, H, s, { vign: 0.55, grain: 0.15, title: 'The east shore, reeds in early mist.' });
}

function lakeroad() {
  const W = 1200, H = 675, r = rng(71);
  let s = sky(W, 340, 340, '#0e0e0d', '#27251f', '#4f4a3f');
  s += hills(W, 340, '#12120f', 60, 21, 80);
  s += water(W, H, 340, '#33322d', '#10100e', 15);
  s += trees(W, 460, 18, 8, '#070706', 140, 300);
  s += `<path d="M0 640 C 260 560 520 500 760 470 C 880 456 1000 452 1200 456 L 1200 675 L 0 675Z" fill="#1f1d19"/><path d="M0 675 C 300 600 560 540 800 510 C 900 498 1040 494 1200 498 L 1200 675Z" fill="#171512"/>`;
  for (let i = 0; i < 60; i++) { const x = r() * W, y = 520 + r() * 150; s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(3 + r() * 9)}" ry="${f1(1 + r() * 3)}" fill="#2f2c26" opacity=".7"/>`; }
  s += `<rect x="878" y="440" width="6" height="64" fill="#0a0a09"/><rect x="866" y="424" width="34" height="22" rx="3" fill="#0a0a09"/><rect x="900" y="436" width="4" height="12" fill="#8e2b2a"/>`; // mailbox
  for (let i = 0; i < 12; i++) s += `<rect x="${f1(980 + i * 22)}" y="${f1(470 + i * 1.2)}" width="4" height="34" fill="#0a0a09"/>`;
  s += `<line x1="980" y1="486" x2="1230" y2="494" stroke="#0a0a09" stroke-width="2"/>`;
  s += windowLit(160, 408, 24, 18, .8) + `<rect x="130" y="396" width="86" height="64" fill="#0a0907" opacity=".0"/>`;
  s += fog(W, 440, 120, .15);
  return svg(W, H, s, { vign: 0.75, title: 'The lake road, gravel and fence, a mailbox.' });
}

function busdepot() {
  const W = 1200, H = 675, r = rng(81);
  let s = sky(W, 400, 400, '#2c2c2a', '#5c5a54', '#8a867a');
  s += `<rect y="400" width="${W}" height="275" fill="#1a1917"/><rect y="400" width="${W}" height="6" fill="#0a0a09"/>`;
  s += `<rect x="60" y="150" width="560" height="14" fill="#0c0c0b"/><rect x="70" y="164" width="10" height="250" fill="#0c0c0b"/><rect x="600" y="164" width="10" height="250" fill="#0c0c0b"/><rect x="80" y="164" width="520" height="190" fill="#d9d1c0" opacity=".06"/>`;
  s += `<rect x="110" y="330" width="440" height="12" fill="#0a0a09"/><rect x="120" y="342" width="8" height="70" fill="#0a0a09"/><rect x="530" y="342" width="8" height="70" fill="#0a0a09"/>`;
  s += `<rect x="640" y="190" width="150" height="190" fill="#0c0c0b"/><rect x="650" y="200" width="130" height="170" fill="#c9c1ae"/>`;
  for (let i = 0; i < 9; i++) s += `<rect x="660" y="${212 + i * 17}" width="${i % 3 === 0 ? 100 : 70}" height="4" fill="#2a2724" opacity=".6"/>`;
  s += `<rect x="654" y="203" width="122" height="6" fill="#8e2b2a" opacity=".85"/>`;
  s += `<rect x="760" y="430" width="440" height="150" rx="10" fill="#0e0d0c"/><rect x="780" y="448" width="90" height="50" fill="#e2b66a" opacity=".25"/><rect x="884" y="448" width="90" height="50" fill="#e2b66a" opacity=".2"/><rect x="988" y="448" width="90" height="50" fill="#e2b66a" opacity=".2"/><circle cx="850" cy="580" r="34" fill="#050504"/><circle cx="1090" cy="580" r="34" fill="#050504"/><rect x="760" y="520" width="440" height="6" fill="#8e2b2a" opacity=".6"/>`;
  s += fog(W, 380, 100, .2);
  return svg(W, H, s, { vign: 0.65, title: 'The bus depot, early morning, an empty bench.' });
}

// Evidence photos
function figure(x, y, s, fill, pose) {
  // Keep the swimmer low against the hull.
  const body = pose === 'crouch'
    ? `<path d="M-16 0 C -14 -22 14 -22 16 0 L 22 8 L -22 8Z" fill="${fill}"/><circle cx="0" cy="-28" r="9" fill="${fill}"/><path d="M-12 -14 C -26 -6 -30 4 -26 12" stroke="${fill}" stroke-width="5" fill="none"/>`
    : `<path d="M-18 8 C -16 -10 16 -10 18 8Z" fill="${fill}"/><circle cx="0" cy="-8" r="10" fill="${fill}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
}

function photoC01() {
  const W = 800, H = 600;
  let s = sky(W, 280, 280, '#1a1a19', '#3a3935', '#6b665a');
  s += hills(W, 280, '#1a1a18', 24, 5, 60);
  s += water(W, H, 282, '#34332f', '#0f0f0e', 6);
  s += `<g transform="rotate(-8 400 330)">`;
  // MIST is capsized; its mast lies along the water.
  s += `<path d="M200 350 C 240 290 500 270 610 330 C 560 372 300 392 200 350Z" fill="#cfc6b4"/><path d="M200 350 C 300 392 560 372 610 330 C 580 392 340 420 200 350Z" fill="#6c665a"/>`;
  s += `<path d="M610 330 L 760 316" stroke="#1a1917" stroke-width="7" stroke-linecap="round"/><path d="M300 372 C 380 368 470 356 560 340" stroke="#0e0d0c" stroke-width="3" fill="none" opacity=".55"/>`;
  s += `<text transform="translate(330 336) rotate(-6)" font-family="Arial Black, Impact, sans-serif" font-size="34" font-weight="900" fill="#1a1917" opacity=".8" letter-spacing="4">MIST</text>`;
  s += figure(468, 296, 1.5, '#0c0b0a', 'crouch');
  s += `</g>`;
  s += `<path d="M120 410 C 260 400 400 414 560 406" stroke="#d9d1c0" stroke-width="2" opacity=".12" fill="none"/>`;
  // One person in the water holds the other’s arm.
  s += `<g><ellipse cx="250" cy="458" rx="96" ry="14" fill="#0a0a09" opacity=".5"/>${figure(210, 462, 2.8, '#0c0b0a', 'head')}${figure(300, 466, 2.6, '#100f0d', 'head')}<path d="M232 440 C 254 432 276 434 286 442" stroke="#0c0b0a" stroke-width="11" stroke-linecap="round" fill="none"/></g>`;
  s += `<path d="M0 470 C 200 456 340 480 800 462 L 800 600 L 0 600Z" fill="#0a0a09" opacity=".35"/>`;
  s += `<g font-family="ui-monospace, Menlo, Consolas, monospace" font-size="24" fill="#e9a23b" opacity=".92"><text x="610" y="560">20:41</text></g>`;
  s += `<circle cx="660" cy="130" r="7" fill="#d9d1c0" opacity=".22"/><circle cx="660" cy="130" r="3" fill="#fff" opacity=".35"/>`; // lens droplet
  return svg(W, H, s, { vign: 0.85, grain: 0.22, title: 'Photograph, 20:41: MIST on its side. One person on the hull, one in the water holding another person’s arm.' });
}

function camC11() {
  const W = 800, H = 600;
  let s = `<rect width="${W}" height="${H}" fill="#2e312d"/>` + sky(W, 230, 230, '#30332f', '#3c403b', '#5a5e57');
  s += `<rect y="230" width="${W}" height="${H - 230}" fill="#232623"/>`;
  s += `<path d="M300 600 L 372 230 L 428 230 L 560 600Z" fill="#4a4d46"/><path d="M300 600 L 372 230 L 378 230 L 322 600Z" fill="#161816"/><path d="M560 600 L 428 230 L 422 230 L 536 600Z" fill="#161816"/>`;
  for (let i = 0; i < 14; i++) { const t = i / 13, y = 236 + Math.pow(t, 1.7) * 360, xl = 372 - 72 * Math.pow(t, 1.7), xr = 428 + 132 * Math.pow(t, 1.7); s += `<line x1="${f1(xl)}" y1="${f1(y)}" x2="${f1(xr)}" y2="${f1(y)}" stroke="#171917" stroke-width="${f1(1 + t * 2.4)}"/>`; }
  s += `<rect x="540" y="238" width="22" height="210" fill="#121412"/><rect x="534" y="230" width="34" height="10" fill="#1c1e1b"/>`;
  s += `<rect x="0" y="228" width="${W}" height="3" fill="#6a6e66" opacity=".5"/>`;
  s += `<defs><pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity=".22"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#sl)"/>`;
  s += `<g font-family="ui-monospace, Menlo, Consolas, monospace" font-size="26" fill="#e8e3d4" opacity=".92"><text x="28" y="48">DOCK LIGHT</text><text x="28" y="86" opacity=".7" font-size="20">CAM 1</text><text x="640" y="566">01:15</text></g><circle cx="768" cy="38" r="7" fill="#8e2b2a"/>`;
  return svg(W, H, s, { vign: 0.8, grain: 0.3, title: 'Dock light camera, 01:15. The dock, the post, the water.' });
}

function simSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260"><title>A prepaid SIM card</title><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6dfcf"/><stop offset="1" stop-color="#a99f8a"/></linearGradient><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0c27a"/><stop offset=".5" stop-color="#b59248"/><stop offset="1" stop-color="#d6b866"/></linearGradient></defs><rect width="400" height="260" fill="#12110f"/><path d="M60 40 L 280 40 L 340 100 L 340 220 L 60 220Z" fill="url(#g)" stroke="#0b0a09" stroke-width="3"/><rect x="130" y="100" width="110" height="82" rx="10" fill="url(#c)" stroke="#6e5a26" stroke-width="2"/><path d="M130 128 H 240 M130 154 H 240 M168 100 V 182 M204 100 V 182" stroke="#6e5a26" stroke-width="2"/><text x="80" y="76" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" fill="#2a2724">PREPAID</text></svg>`;
}

// Ending artwork (1200 × 460)
function table(y = 330) { return `<rect y="${y}" width="1200" height="${460 - y}" fill="#0c0b0a"/><rect y="${y}" width="1200" height="5" fill="#2a2520"/>`; }
function bgRoom(extra = '') { return `<rect width="1200" height="460" fill="#0f0e0c"/><rect width="1200" height="330" fill="url(#rw)"/><defs><linearGradient id="rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090908"/><stop offset="1" stop-color="#201d19"/></linearGradient></defs>${extra}`; }
function lamp(x, op = 0.28) { return `<defs><radialGradient id="lp${x}" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#e6bf78" stop-opacity="${op}"/><stop offset="1" stop-color="#e6bf78" stop-opacity="0"/></radialGradient></defs><path d="M${x - 40} 40 L ${x - 330} 460 L ${x + 330} 460 L ${x + 40} 40Z" fill="url(#lp${x})"/><rect x="${x - 40}" y="30" width="80" height="12" rx="6" fill="#050504"/><line x1="${x}" y1="0" x2="${x}" y2="30" stroke="#050504" stroke-width="3"/>`; }

const ENDINGS = {
  struck() {
    let s = bgRoom(`<rect x="250" y="40" width="700" height="400" fill="#cfc6b3" opacity=".9" transform="rotate(-2 600 240)"/>`);
    const r = rng(2);
    for (let i = 0; i < 13; i++) { const y = 70 + i * 28; s += `<rect x="290" y="${y}" width="${f1(380 + r() * 220)}" height="6" fill="#2a2724" opacity=".5" transform="rotate(-2 600 240)"/>`; }
    for (let i = 0; i < 9; i++) { const y = 66 + i * 38 + r() * 8; s += `<rect x="${f1(270 + r() * 30)}" y="${f1(y)}" width="${f1(540 + r() * 100)}" height="${f1(16 + r() * 10)}" fill="#0b0a09" transform="rotate(-2 600 240)"/>`; }
    for (let i = 0; i < 4; i++) { const y = 80 + i * 90 + r() * 20; s += `<path d="M${f1(280 + r() * 50)} ${f1(y)} L ${f1(780 + r() * 140)} ${f1(y + 18 + r() * 20)}" stroke="#8e2b2a" stroke-width="5" fill="none" transform="rotate(-2 600 240)"/>`; }
    s += `<rect x="760" y="300" width="150" height="110" fill="#0f0e0c" transform="rotate(5 835 355)"/><path d="M760 300 L 790 300 L 760 330Z" fill="#0f0e0c"/>`; // where the photograph was
    return svg(1200, 460, s, { vign: 0.7, title: 'A page struck through.' });
  },
  same() {
    let s = bgRoom(lamp(600, 0.2)) + table();
    for (let i = 0; i < 5; i++) s += chair(260 + i * 170, 400, 1.7, '#16130f');
    for (let i = 0; i < 7; i++) s += `<text x="600" y="${70 + i * 24}" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#d9d1c0" opacity="${f1(0.55 - i * 0.07)}" letter-spacing="1">The wind turned. Nobody could have known.</text>`;
    return svg(1200, 460, s, { vign: 0.7, title: 'Five identical chairs. One sentence, repeated.' });
  },
  noanswer() {
    let s = bgRoom(lamp(600, 0.22)) + table();
    s += `<g transform="rotate(-3 600 360)"><rect x="470" y="348" width="260" height="70" rx="3" fill="#b9aa86"/><path d="M470 348 L 730 348 L 700 300 L 500 300Z" fill="#cdbf9c"/></g><rect x="520" y="282" width="150" height="180" fill="#d9d1c0" opacity=".9" transform="rotate(4 600 360)"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="542" y="${306 + i * 30}" width="${i === 4 ? 40 : 100}" height="3" fill="#2a2724" opacity=".14" transform="rotate(4 600 360)"/>`;
    s += chair(260, 400, 1.6, '#16130f') + chair(940, 400, 1.6, '#16130f');
    return svg(1200, 460, s, { vign: 0.7, title: 'A closed folder and a blank page.' });
  },
  five() {
    let s = bgRoom(lamp(540, 0.26)) + table();
    for (let i = 0; i < 5; i++) {
      const emptyNellSeat = i === 4 ? '<ellipse cx="0" cy="2" rx="62" ry="10" fill="#e6bf78" opacity=".18"/>' : '';
      s += chair(180 + i * 150, 400, 1.7, i === 4 ? '#2b2419' : '#16130f', emptyNellSeat);
    }
    s += `<rect x="360" y="338" width="190" height="14" fill="#cdbf9c" opacity=".85" transform="rotate(-2 455 345)"/>`;
    return svg(1200, 460, s, { vign: 0.7, title: 'Five chairs at the table. Nell’s place by the window is empty.' });
  },
  letter() {
    let s = bgRoom(lamp(500, 0.3)) + table(300);
    s += `<g transform="rotate(-4 500 370)"><rect x="330" y="316" width="300" height="120" fill="#d9d1c0"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="352" y="${338 + i * 16}" width="${i === 5 ? 90 : 250}" height="2.5" fill="#2a2724" opacity=".38"/>`;
    s += `</g><g transform="rotate(8 730 380)"><rect x="680" y="350" width="150" height="90" fill="#b9aa86"/><path d="M680 350 L 755 400 L 830 350Z" fill="#a39573"/></g>`;
    s += `<path d="M300 420 L 420 330" stroke="#050504" stroke-width="7" stroke-linecap="round"/>`;
    s += `<g transform="rotate(-10 980 370)"><rect x="930" y="310" width="96" height="150" rx="12" fill="#09090a"/><rect x="938" y="322" width="80" height="124" rx="6" fill="#d8d2c0" opacity=".75"/><rect x="948" y="338" width="50" height="6" fill="#2a2724" opacity=".5"/><rect x="948" y="352" width="60" height="6" fill="#2a2724" opacity=".4"/><rect x="948" y="366" width="36" height="6" fill="#2a2724" opacity=".4"/></g>`;
    return svg(1200, 460, s, { vign: 0.7, title: 'A letter, an envelope, a pen, and a phone.' });
  },
  card() {
    let s = bgRoom(lamp(600, 0.3)) + table(290);
    s += `<ellipse cx="420" cy="396" rx="190" ry="44" fill="#d4ccbb"/><ellipse cx="420" cy="392" rx="140" ry="30" fill="#bdb4a2"/><circle cx="380" cy="386" r="16" fill="#8e5a3a"/><circle cx="438" cy="392" r="14" fill="#6e7a52"/><circle cx="410" cy="376" r="11" fill="#b69a5e"/>`;
    s += `<g transform="rotate(-8 600 372)"><path d="M570 336 L 636 336 L 654 356 L 654 408 L 570 408Z" fill="#d6cfbe" stroke="#050504" stroke-width="2"/><rect x="588" y="360" width="40" height="30" rx="4" fill="#b59248"/></g>`;
    s += `<g transform="rotate(-14 860 400) translate(0 -4)" fill="#6a5242"><rect x="820" y="392" width="300" height="58" rx="26"/><ellipse cx="800" cy="406" rx="46" ry="34"/><rect x="736" y="386" width="70" height="15" rx="7.5"/><rect x="730" y="404" width="76" height="15" rx="7.5"/><rect x="738" y="422" width="68" height="14" rx="7"/><rect x="748" y="439" width="56" height="13" rx="6.5"/></g><g transform="rotate(-14 860 400)" fill="#2a211c"><rect x="820" y="392" width="300" height="58" rx="26"/><ellipse cx="800" cy="406" rx="46" ry="34"/><rect x="736" y="386" width="70" height="15" rx="7.5"/><rect x="730" y="404" width="76" height="15" rx="7.5"/><rect x="738" y="422" width="68" height="14" rx="7"/><rect x="748" y="439" width="56" height="13" rx="6.5"/></g>`;
    return svg(1200, 460, s, { vign: 0.7, title: 'A SIM card on the table between the food and a hand.' });
  },
  nell() {
    let s = `<rect width="1200" height="460" fill="#0e0d0c"/>`;
    s += sky(1200, 300, 300, '#0a0a09', '#26231f', '#4a443b');
    s += `<rect x="360" y="40" width="480" height="260" fill="#040404"/><rect x="372" y="52" width="456" height="236" fill="url(#sky)"/>`;
    s += hills(1200, 288, '#12120f', 30, 4, 90).replace('M0 288', 'M372 288');
    s += `<rect x="372" y="236" width="456" height="52" fill="#0d0d0c" opacity=".9"/><rect x="598" y="40" width="6" height="260" fill="#040404"/><rect x="360" y="160" width="480" height="6" fill="#040404"/>`;
    s += `<rect y="300" width="1200" height="160" fill="#0c0b0a"/><rect y="300" width="1200" height="5" fill="#2a2520"/>`;
    s += lamp(600, 0.18);
    for (let i = 0; i < 5; i++) {
      const x = 170 + i * 172;
      const lit = i === 4 ? '<ellipse cx="0" cy="2" rx="62" ry="10" fill="#e6bf78" opacity=".3"/><rect x="-17" y="-92" width="34" height="58" rx="3" fill="#e6bf78" opacity=".1"/>' : '';
      s += chair(x, 410, 1.7, i === 4 ? '#1d1914' : '#13110e', lit);
    }
    return svg(1200, 460, s, { vign: 0.7, title: 'Five chairs at the table. Nell’s place by the window is empty.' });
  },
};

// Write the artwork
for (const id of Object.keys(PEOPLE)) write(`portraits/${id}.svg`, portrait(id));
write('places/hero.svg', hero());
write('places/greywater.svg', greywater());
write('places/house.svg', house());
write('places/dock.svg', dock());
write('places/eastshore.svg', eastshore());
write('places/lakeroad.svg', lakeroad());
write('places/busdepot.svg', busdepot());
write('evidence/photo-c01.svg', photoC01());
write('evidence/cam-c11.svg', camC11());
write('evidence/sim.svg', simSvg());
const map = { struck: 'struck', same: 'the-same-sentence', noanswer: 'no-answer', five: 'the-five', letter: 'the-letter', card: 'the-card', nell: 'nell-the-five' };
for (const [k, fn] of Object.entries(ENDINGS)) write(`endings/${map[k]}.svg`, fn());
console.log('art written to', OUT);
