/* English and Roman Urdu share the same game state and rules. */
(function (root) {
  const G = root.NULLGAME;
  const catalog = root.NULL_UR || { entries: {}, patterns: [] };
  const entries = catalog.entries || {};
  const missing = new Set();
  let language = 'en';

  function escapeRegex(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function compileTemplate(source, translation) {
    const names = [];
    let regex = '^', at = 0, index = 0;
    const token = /\{([^{}]+)\}/g;
    let match;
    while ((match = token.exec(source))) {
      regex += escapeRegex(source.slice(at, match.index));
      const alternatives = match[1].split('|');
      const group = 'p' + index++;
      // A single token can match any value; pipe-separated tokens match one of the listed values.
      regex += alternatives.length > 1
        ? '(?<' + group + '>' + alternatives.map(escapeRegex).join('|') + ')'
        : '(?<' + group + '>.+?)';
      names.push({ token: match[1], group, alternatives });
      at = token.lastIndex;
    }
    regex += escapeRegex(source.slice(at)) + '$';
    try { return { regex: new RegExp(regex), translation, names }; } catch (e) { return null; }
  }

  const compiled = (catalog.patterns || []).map((p) => {
    if (p.sourceRegex) {
      try { return { regex: new RegExp(p.sourceRegex), translation: p.translationTemplate, names: null }; }
      catch (e) { return null; }
    }
    if (p.sourceTemplate) return compileTemplate(p.sourceTemplate, p.translationTemplate);
    return null;
  }).filter(Boolean).sort((a, b) => b.regex.source.length - a.regex.source.length);

  function translateValue(value) {
    if (Object.prototype.hasOwnProperty.call(entries, value)) return entries[value];
    return value;
  }

  function fillPattern(pattern, match) {
    const values = Object.assign({}, match.groups || {});
    if (pattern.names) pattern.names.forEach(({ token, group, alternatives }) => {
      const captured = (match.groups || {})[group];
      const name = token.split('|')[0];
      if (captured !== undefined && !(name in values)) values[name] = captured;
      if (alternatives.length > 1) {
        values.__choice = captured;
        values.plural = captured === alternatives[0] ? 'a' : 'ein';
      }
    });
    return pattern.translation.replace(/\{([^{}]+)\}/g, (_, name) => {
      if (Object.prototype.hasOwnProperty.call(values, name)) {
        const value = values[name];
        if (name === 'cards') return String(value).split('; ').map(translateValue).join('; ');
        return translateValue(value);
      }
      return '';
    });
  }

  function translate(text) {
    const source = String(text);
    if (language !== 'ur' || !source) return source;
    if (Object.prototype.hasOwnProperty.call(entries, source)) return entries[source];

    // Preserve indentation on UI strings built from several pieces.
    const leading = (source.match(/^\s+/) || [''])[0];
    if (leading) {
      const rest = source.slice(leading.length);
      const result = translate(rest);
      if (result !== rest) return leading + result;
    }

    // These messages include a count, so translate them by pattern.
    let m = source.match(/^(\d+) more (?:item|items) tied to this place (?:is|are) not in the file yet\. Someone you have not asked may know\.$/);
    if (m) {
      const n = Number(m[1]);
      if (n === 1) return 'Is maqam se juri ek cheez abhi file mein nahin. Shayad kisi aise shakhs ko pata ho jis se aap ne abhi tak nahin poocha.';
      return n + ' aur cheezen is maqam se judi abhi file mein nahin hain. Shayad kisi aise shakhs ko pata ho jis se aap ne abhi tak nahin poocha.';
    }
    m = source.match(/^(\d+) unclassified card(s?)\.$/);
    if (m) return m[1] + ' ghair-musannaf card abhi baqi hain.';
    m = source.match(/^(\d+) open claim(s?)\.$/);
    if (m) return m[1] + ' khule dawon par abhi faisla baqi hai.';

    for (const pattern of compiled) {
      const match = source.match(pattern.regex);
      if (match) return fillPattern(pattern, match);
    }

    if (/^[\d\s:.,·–—/()'’“”\-✓]+$/.test(source) || source === 'TRUE' || source === 'FALSE' || source === 'NULL') return source;
    missing.add(source);
    return source;
  }

  G.setLanguage = (value) => { language = value === 'ur' ? 'ur' : 'en'; };
  G.getLanguage = () => language;
  G.t = translate;
  G.translationMisses = missing;
  G.clearTranslationMisses = () => missing.clear();
})(typeof window !== 'undefined' ? window : globalThis);
