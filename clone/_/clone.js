/* Clone de travail d'afes.fr : méga-menu, menu mobile, recherche, filtres, onglets. Aucune dépendance. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ROOT = document.body.getAttribute('data-root') || '';

  /* ---------- méga-menu */
  var openId = null, closeT = null, hoverAt = 0;
  function setMenu(id) {
    openId = id;
    $$('.navbtn').forEach(function (b) { b.setAttribute('aria-expanded', String(b.dataset.mm === id)); });
    $$('.mm').forEach(function (p) { p.hidden = p.id !== 'mm-' + id; });
  }
  $$('.navbtn').forEach(function (b) {
    b.addEventListener('click', function () {
      var justHovered = Date.now() - hoverAt < 600;
      setMenu(openId === b.dataset.mm && !justHovered ? null : b.dataset.mm);
    });
    b.addEventListener('mouseenter', function () {
      if (matchMedia('(hover:hover)').matches) { clearTimeout(closeT); if (openId !== b.dataset.mm) hoverAt = Date.now(); setMenu(b.dataset.mm); }
    });
  });
  var head = $('.site-header');
  if (head) {
    head.addEventListener('mouseleave', function () { closeT = setTimeout(function () { setMenu(null); }, 250); });
    head.addEventListener('mouseenter', function () { clearTimeout(closeT); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(null); closeSearch(); } });
  document.addEventListener('click', function (e) { if (openId && !e.target.closest('.site-header')) setMenu(null); });

  /* ---------- menu mobile */
  var burger = $('.burger'), mob = $('#mobnav');
  if (burger && mob) burger.addEventListener('click', function () {
    var o = mob.hidden; mob.hidden = !o; burger.setAttribute('aria-expanded', String(o));
  });

  /* ---------- nouveautés */
  var sn = $('[data-shownew]');
  if (sn) {
    if (sessionStorage.getItem('shownew') === '1') { document.body.classList.add('show-new'); sn.setAttribute('aria-pressed', 'true'); sn.textContent = 'Masquer les nouveautés'; }
    sn.addEventListener('click', function () {
      var on = document.body.classList.toggle('show-new');
      sn.setAttribute('aria-pressed', String(on)); sn.textContent = on ? 'Masquer les nouveautés' : 'Montrer les nouveautés';
      sessionStorage.setItem('shownew', on ? '1' : '0');
    });
  }

  /* ---------- recherche */
  var ov = $('.search-ov'), inp = ov && $('input', ov), res = ov && $('.search-res', ov), idx = null, sel = -1;
  function fold(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function openSearch() {
    ov.hidden = false; inp.focus();
    if (!idx) fetch(ROOT + '_/recherche.json').then(function (r) { return r.json(); }).then(function (j) {
      idx = j.map(function (d) { d.ft = fold(d.t); d.fx = fold(d.x); return d; }); run();
    }).catch(function () { res.innerHTML = '<li><small>Ouvrez le clone par http(s) pour utiliser la recherche.</small></li>'; });
  }
  function closeSearch() { if (ov && !ov.hidden) { ov.hidden = true; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function run() {
    if (!idx) return;
    var q = fold(inp.value).trim();
    var words = q.split(/\s+/).filter(function (w) { return w.length > 1; });
    if (!words.length) { res.innerHTML = ''; return; }
    var hits = [];
    idx.forEach(function (d) {
      var s = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i], inT = d.ft.indexOf(w) > -1, inX = d.fx.indexOf(w) > -1;
        if (!inT && !inX) return;
        s += inT ? 10 : 1;
      }
      if (d.k === 'Page') s += 2;
      hits.push([s, d]);
    });
    hits.sort(function (a, b) { return b[0] - a[0]; });
    sel = -1;
    res.innerHTML = hits.slice(0, 30).map(function (h) {
      var d = h[1], pos = d.fx.indexOf(words[0]), ex = '';
      if (pos > -1) { var a = Math.max(0, pos - 60); ex = (a ? '…' : '') + esc(d.x.substr(a, 170)) + '…'; }
      var t = esc(d.t);
      return '<li><a href="' + ROOT + (d.u ? d.u + '/' : '') + 'index.html"><strong>' + t + '</strong><small><span class="tag">' + d.k + '</span>' + (d.d ? d.d + ' ' : '') + '</small><small>' + ex + '</small></a></li>';
    }).join('') || '<li><small>Aucun résultat.</small></li>';
  }
  if (ov) {
    $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', openSearch); });
    $('[data-search-close]', ov).addEventListener('click', closeSearch);
    ov.addEventListener('click', function (e) { if (e.target === ov) closeSearch(); });
    inp.addEventListener('input', run);
    inp.addEventListener('keydown', function (e) {
      var links = $$('a', res);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); sel = Math.max(0, Math.min(links.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1)));
        links.forEach(function (l, i) { l.classList.toggle('sel', i === sel); }); if (links[sel]) links[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && links[Math.max(sel, 0)]) { location.href = links[Math.max(sel, 0)].href; }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    });
  }

  /* ---------- accueil : « Je suis… » */
  $$('.prof').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.prof').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      $$('[data-routes]').forEach(function (r) { r.hidden = r.dataset.routes !== b.dataset.prof; });
    });
  });

  /* ---------- filtres simples (formations, projets) */
  function simpleFilter(attr, items) {
    $$('[' + attr + ']').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[' + attr + ']').forEach(function (x) { x.classList.toggle('on', x === b); });
        var v = b.getAttribute(attr);
        $$(items).forEach(function (c) { c.hidden = v && c.dataset.cat !== v; });
      });
    });
  }
  simpleFilter('data-fcat', '.fcard');
  simpleFilter('data-pcat', '.pcard[data-cat]');

  /* ---------- actualités */
  if (window.ACTUS) {
    var grid = $('#actu-grid'), more = $('#actu-more'), q = $('#actu-q'), n = $('#actu-n');
    var cat = '', shown = 12;
    var m = location.hash.match(/cat=([\w-]+)/); if (m) cat = m[1];
    function card(a) {
      var tags = '<span class="tag date">' + esc(a.d) + '</span>' + a.c.slice(0, 2).map(function (c) { return '<span class="tag">' + esc(window.CATS[c] || c) + '</span>'; }).join('') + (a.p ? '<span class="tag lock">🔒 Adhérent·es</span>' : '');
      return '<a class="pcard" href="' + a.h + '"><img src="' + esc(a.i || (ROOT + '../assets/actu-territoires.png')) + '" alt="" loading="lazy"><div class="pcard-b"><div class="tags">' + tags + '</div><h3>' + esc(a.t) + '</h3></div></a>';
    }
    function draw() {
      var f = fold(q.value).trim();
      var list = window.ACTUS.filter(function (a) { return (!cat || a.c.indexOf(cat) > -1) && (!f || fold(a.t).indexOf(f) > -1); });
      grid.innerHTML = list.slice(0, shown).map(card).join('');
      more.hidden = list.length <= shown;
      n.textContent = list.length + ' actualité' + (list.length > 1 ? 's' : '');
      $$('[data-cat]').forEach(function (b) { if (b.tagName === 'BUTTON') b.classList.toggle('on', b.dataset.cat === cat); });
    }
    $$('button[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () { cat = b.dataset.cat; shown = 12; history.replaceState(null, '', cat ? '#cat=' + cat : location.pathname); draw(); });
    });
    q.addEventListener('input', function () { shown = 12; draw(); });
    more.addEventListener('click', function () { shown += 12; draw(); });
    window.addEventListener('hashchange', function () { var m2 = location.hash.match(/cat=([\w-]+)/); cat = m2 ? m2[1] : ''; draw(); });
    draw();
  }

  /* ---------- espace adhérent : onglets */
  $$('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      $$('.tab').forEach(function (x) { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', String(x === t)); });
      $$('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== t.dataset.tab; });
    });
  });

  /* ---------- sommaire : section en cours */
  var tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) tocLinks.forEach(function (l) { l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    tocLinks.forEach(function (l) { var t = document.getElementById(l.getAttribute('href').slice(1)); if (t) io.observe(t); });
  }
})();
