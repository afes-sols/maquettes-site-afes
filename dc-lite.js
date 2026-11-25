/* dc-lite : petit moteur qui affiche les maquettes du canevas (format .dc.html)
   sans l'éditeur Claude. Gère {{ trous }}, <sc-for>, <sc-if>, onClick, setState,
   les réglages (data-props) et les paramètres d'URL (?ouvert=former). */
(function () {
  'use strict';

  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(patch) {
      Object.assign(this.state, typeof patch === 'function' ? patch(this.state) : patch);
      if (this.__render) this.__render();
    }
    forceUpdate() { if (this.__render) this.__render(); }
  }
  window.DCLogic = DCLogic;

  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  const WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^(['"]).*\1$/.test(path)) return path.slice(1, -1);
    const parts = path.split('.');
    let cur = scope;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function interp(str, scope) {
    return str.replace(HOLE, (_, p) => {
      const v = lookup(p, scope);
      return v == null ? '' : String(v);
    });
  }

  function processNode(node, scope) {
    if (node.nodeType === 3) {
      if (node.nodeValue.indexOf('{{') !== -1) node.nodeValue = interp(node.nodeValue, scope);
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();

    if (tag === 'sc-for') {
      const listAttr = node.getAttribute('list') || '';
      const m = listAttr.match(WHOLE);
      const list = (m ? lookup(m[1], scope) : []) || [];
      const as = node.getAttribute('as') || 'item';
      const frag = document.createDocumentFragment();
      list.forEach((item, i) => {
        const childScope = Object.assign(Object.create(scope), { [as]: item, $index: i });
        Array.from(node.childNodes).forEach((c) => {
          const clone = c.cloneNode(true);
          const wrap = node.ownerDocument.createElement('div');
          wrap.appendChild(clone);
          processChildren(wrap, childScope);
          while (wrap.firstChild) frag.appendChild(wrap.firstChild);
        });
      });
      node.replaceWith(frag);
      return;
    }

    if (tag === 'sc-if') {
      const v = node.getAttribute('value') || '';
      const m = v.match(WHOLE);
      const ok = m ? !!lookup(m[1], scope) : !!v;
      if (!ok) { node.remove(); return; }
      processChildren(node, scope);
      const frag = document.createDocumentFragment();
      while (node.firstChild) frag.appendChild(node.firstChild);
      node.replaceWith(frag);
      return;
    }

    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name;
      const val = attr.value;
      if (name.indexOf('hint-') === 0) { node.removeAttribute(name); return; }
      if (val.indexOf('{{') === -1) return;
      const whole = val.match(WHOLE);
      if (/^on[a-z]+$/.test(name) && whole) {
        const fn = lookup(whole[1], scope);
        node.removeAttribute(name);
        if (typeof fn === 'function') node.addEventListener(name.slice(2), (e) => { fn(e); });
        return;
      }
      if (whole) {
        const v = lookup(whole[1], scope);
        if (v === false || v == null) {
          if (/^aria-/.test(name)) node.setAttribute(name, 'false');
          else node.removeAttribute(name);
        } else node.setAttribute(name, v === true ? (/^aria-/.test(name) ? 'true' : '') : String(v));
        return;
      }
      node.setAttribute(name, interp(val, scope));
    });
    processChildren(node, scope);
  }

  function processChildren(el, scope) {
    Array.from(el.childNodes).forEach((c) => processNode(c, scope));
  }

  /* Adaptations écran : bouton ☰ pour le menu principal, réduction des maquettes de taille fixe */
  let navOpen = false;
  function enhance(mount) {
    const first = mount.firstElementChild;
    const fixed = !!(first && /width:\s*1280px/.test(first.getAttribute('style') || ''));
    document.documentElement.classList.toggle('dc-fixed', fixed);
    const nav = mount.querySelector('header nav[aria-label="Menu principal"]');
    if (!fixed && nav && !mount.querySelector('.dc-burger')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dc-burger';
      b.setAttribute('aria-expanded', navOpen ? 'true' : 'false');
      b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"></path></svg>Menu';
      if (navOpen) nav.classList.add('open');
      b.addEventListener('click', () => {
        navOpen = !navOpen;
        nav.classList.toggle('open', navOpen);
        b.setAttribute('aria-expanded', navOpen ? 'true' : 'false');
      });
      nav.parentNode.insertBefore(b, nav);
    }
    const root = mount.firstElementChild;
    if (root && /width:\s*1280px/.test(root.getAttribute('style') || '')) {
      const fit = () => { root.style.zoom = Math.min(1, document.documentElement.clientWidth / 1280); };
      fit();
      if (!window.__dcFit) { window.__dcFit = true; window.addEventListener('resize', fit); }
      if (!document.querySelector('.dc-fixed-note')) {
        const n = document.createElement('div');
        n.className = 'dc-fixed-note';
        n.textContent = 'Maquette du menu sur ordinateur, réduite pour votre écran. Sur téléphone, le menu s’ouvre avec un bouton ☰ (voir les autres maquettes).';
        mount.parentNode.insertBefore(n, mount);
      }
    }
  }

  function boot() {
    const tpl = document.getElementById('dc-template');
    const mount = document.getElementById('dc-root');
    const script = document.querySelector('script[data-dc-script]');
    if (!tpl || !mount) return;

    let propsDef = {};
    try { propsDef = JSON.parse(script ? script.getAttribute('data-props') || '{}' : '{}'); } catch (e) { propsDef = {}; }
    const props = {};
    Object.keys(propsDef).forEach((k) => {
      if (k.charAt(0) === '$') return;
      if (propsDef[k] && 'default' in propsDef[k]) props[k] = propsDef[k].default;
    });
    const qs = new URLSearchParams(location.search);
    qs.forEach((v, k) => { props[k] = v === 'true' ? true : v === 'false' ? false : v; });

    let Component = DCLogic;
    if (script) {
      try { Component = new Function('DCLogic', script.textContent + '\n;return Component;')(DCLogic); }
      catch (e) { console.error('dc-lite : script de la maquette illisible', e); }
    }
    const inst = new Component(props);
    inst.props = props;
    if (!inst.state) inst.state = {};

    inst.__render = function () {
      let vals = {};
      try { vals = inst.renderVals ? inst.renderVals() || {} : {}; } catch (e) { console.error(e); }
      const frag = tpl.content.cloneNode(true);
      const wrap = tpl.content.ownerDocument.createElement('div');
      wrap.appendChild(frag);
      processChildren(wrap, vals);
      document.adoptNode(wrap);
      const y = window.scrollY;
      mount.replaceChildren(...wrap.childNodes);
      enhance(mount);
      window.scrollTo(0, y);
    };
    inst.__render();
    if (inst.componentDidMount) inst.componentDidMount();

    /* Barre d'outils de la maquette : retour au sommaire + nouveautés */
    const bar = document.createElement('div');
    bar.className = 'dc-tools';
    bar.innerHTML = '<a href="index.html">← Sommaire</a>';
    const orig = document.querySelector('meta[name="dc-original"]');
    if (orig) {
      const o = document.createElement('a');
      o.href = orig.getAttribute('content');
      o.target = '_blank';
      o.rel = 'noopener';
      o.textContent = 'Page actuelle ↗';
      o.title = 'Ouvrir la page correspondante sur afes.fr, pour comparer';
      bar.appendChild(o);
    }
    if ('showNew' in propsDef) {
      const b = document.createElement('button');
      b.type = 'button';
      const label = () => { b.textContent = props.showNew ? 'Masquer les nouveautés' : 'Montrer les nouveautés'; };
      label();
      b.addEventListener('click', () => { props.showNew = !props.showNew; label(); inst.__render(); });
      bar.appendChild(b);
    }
    document.body.appendChild(bar);
  }

  const css = document.createElement('style');
  css.textContent = '.dc-tools{position:fixed;left:12px;bottom:12px;z-index:9999;display:flex;gap:8px;font:600 13px/1 "Open Sans",sans-serif}' +
    '.dc-tools a,.dc-tools button{background:#2F180A;color:#fff;border:0;border-radius:999px;padding:10px 14px;text-decoration:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);font:inherit}' +
    '.dc-tools a:hover,.dc-tools button:hover{background:#BF6525;color:#fff}';
  document.head.appendChild(css);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
