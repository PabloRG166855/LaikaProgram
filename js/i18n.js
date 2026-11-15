/* Idioma del juego (inglés por defecto, o español).
 * El juego está escrito en español; en inglés, cada texto que aparece en pantalla (HTML o lienzo)
 * se cambia por su traducción del diccionario window.LAIKA_EN (js/i18n-en.js).
 * Lo usan la app principal y los minijuegos (comparten la elección en localStorage).
 */
(() => {
  'use strict';
  const KEY = 'laika-lang';
  let lang = 'en';
  try {
    lang = localStorage.getItem(KEY) || 'en';
  } catch {
    /* sin almacenamiento: inglés */
  }
  const dict = window.LAIKA_EN || { exact: {}, patterns: [] };
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const exact = new Map();
  for (const [k, v] of Object.entries(dict.exact)) exact.set(norm(k), v);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = dict.patterns.map(([es, en]) => {
    const names = [];
    const src = esc(norm(es)).replace(/\\\{(\d+)\\\}/g, (_, n) => {
      names.push(n);
      return '(.+?)';
    });
    return { re: new RegExp(`^${src}$`), names, en };
  });
  const cache = new Map();

  /** Traduce un texto (si el idioma es inglés y hay traducción). */
  function t(str) {
    if (lang !== 'en' || str == null) return str;
    const s = String(str);
    if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(s)) return s;
    if (cache.has(s)) return cache.get(s);
    const lead = s.match(/^\s*/)[0];
    const trail = s.match(/\s*$/)[0];
    const core = norm(s);
    let out = exact.get(core);
    if (out == null) {
      for (const p of patterns) {
        const m = core.match(p.re);
        if (!m) continue;
        out = p.en;
        p.names.forEach((n, i) => {
          out = out.split(`{${n}}`).join(t(m[i + 1]));
        });
        break;
      }
    }
    const res = out == null ? s : lead + out + trail;
    if (cache.size > 5000) cache.clear();
    cache.set(s, res);
    return res;
  }

  // ---------- Traducción automática de la página ----------
  const ATTRS = ['title', 'alt', 'aria-label', 'placeholder'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE']);
  function fixText(node) {
    const p = node.parentNode;
    if (!p || SKIP.has(p.nodeName)) return;
    const v = node.data;
    const n = t(v);
    if (n !== v) node.data = n;
  }
  function fixAttrs(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v) {
        const n = t(v);
        if (n !== v) el.setAttribute(a, n);
      }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1 || SKIP.has(root.nodeName)) return;
    fixAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n = tw.nextNode();
    while (n) {
      if (n.nodeType === 3) fixText(n);
      else fixAttrs(n);
      n = tw.nextNode();
    }
  }
  function startObserver() {
    document.documentElement.lang = lang;
    if (lang !== 'en') return;
    if (document.title) document.title = t(document.title);
    walk(document.body);
    new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'characterData') fixText(m.target);
        else if (m.type === 'attributes') fixAttrs(m.target);
        else m.addedNodes.forEach(walk);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  /** Botón EN | ES (solo en la app principal). */
  function addToggle() {
    if (document.getElementById('lang-toggle') || window.parent !== window) return;
    const b = document.createElement('div');
    b.id = 'lang-toggle';
    b.setAttribute('role', 'group');
    b.setAttribute('aria-label', 'Language / Idioma');
    b.innerHTML = `<button type="button" data-l="en" class="${lang === 'en' ? 'on' : ''}">EN</button><button type="button" data-l="es" class="${lang === 'es' ? 'on' : ''}">ES</button>`;
    b.addEventListener('click', (e) => {
      const l = e.target.closest('[data-l]')?.dataset.l;
      if (!l || l === lang) return;
      try {
        localStorage.setItem(KEY, l);
      } catch {
        /* ignore */
      }
      location.reload();
    });
    document.body.appendChild(b);
  }

  window.LAIKA_I18N = { t, get lang() { return lang; }, addToggle };
  window.T = t;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver);
  else startObserver();
})();
