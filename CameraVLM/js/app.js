(() => {
  const C = window.CAMERAVLM_CONTENT, P = window.PAPER;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Videos get their source only when they come within ~1.5 screens of the viewport, so the hero loads first.
  const near = new WeakSet();
  function setClip(v, src, poster) {
    v.poster = poster; v.dataset.src = src;
    if (near.has(v)) { v.src = src; v.load(); if (!reduce) v.play().catch(() => {}); }
  }
  const arm = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const v = e.target; near.add(v); arm.unobserve(v);
    if (v.dataset.src && !v.getAttribute('src')) { v.src = v.dataset.src; v.load(); }
  }), { rootMargin: '150% 0px' });

  // ---------- main results table (one table, paper order) ----------
  function mainTable() {
    const T = $('#tbl-main'); if (!T) return;
    const groups = P.main;
    const all = groups.flatMap(g => g.rows).filter(r => r[0] !== 'Human');
    const ranks = [2, 3, 4, 5].map(col => { const v = [...new Set(all.map(r => r[col]))].sort((x, y) => y - x); return { best: v[0], second: v[1] }; });
    T.querySelector('thead').innerHTML = '<tr><th scope="col">Model</th><th scope="col">Params</th><th scope="col">CameraBench</th><th scope="col">CineTechBench</th><th scope="col">ShotBench</th><th scope="col">Average</th></tr>';
    let html = '';
    groups.forEach(g => {
      if (g.group) html += `<tr class="grp"><td colspan="6">${esc(g.group)}</td></tr>`;
      else if (!g.ours) html += '<tr class="grp"><td colspan="6">Reference</td></tr>';
      g.rows.forEach(r => {
        const cls = g.ours ? 'ours' : r[0] === 'Human' ? 'human' : '';
        html += `<tr class="${cls}"><td>${esc(r[0])}</td><td>${esc(r[1])}</td>` + [2, 3, 4, 5].map((c, i) => {
          const k = r[0] === 'Human' ? '' : r[c] === ranks[i].best ? 'best' : r[c] === ranks[i].second ? 'second' : '';
          return `<td class="${k}">${r[c].toFixed(2)}</td>`;
        }).join('') + '</tr>';
      });
    });
    T.querySelector('tbody').innerHTML = html;
  }

  // ---------- qualitative player ----------
  const order = ['shotbench_3345', 'cinetech_101', 'camerabench_7668', 'cinetech_094', 'shotbench_3494', 'shotbench_3540', 'cinetech_124', 'cinetech_095', 'camerabench_11490', 'cinetech_006', 'cinetech_080', 'cinetech_118'];
  const cases = order.map(id => C.cases.find(c => c.id === id)).filter(Boolean);
  const bench = id => id.startsWith('cinetech') ? 'CineTechBench' : id.startsWith('shotbench') ? 'ShotBench' : 'CameraBench';
  function showCase(i, focus) {
    const c = cases[i]; if (!c) return;
    const v = $('#player-video');
    setClip(v, c.video, c.poster);
    $('#player-label').textContent = c.label;
    $('#player-src').textContent = `${bench(c.id)} · clip ${c.id.split('_')[1]}`;
    $('#player-q').textContent = c.question;
    const mc = c.options && Object.keys(c.options).length > 0;
    const opts = mc ? Object.entries(c.options) : [['Yes', 'Yes'], ['No', 'No']];
    $('#player-opts').innerHTML = opts.map(([k, t]) => `<li class="${k === c.gold ? 'gold' : ''}">${mc ? `<b>${esc(k)}</b>` : ''}<span>${esc(t)}</span></li>`).join('');
    $('#player-answers').innerHTML = c.answers.map(a =>
      `<div class="ans${a.model === 'CameraVLM' ? ' ours' : ''}"><span class="who">${esc(a.model)}</span><span class="pick">${esc(a.choice)}</span><span class="v ${a.correct ? 'y' : 'n'}">${a.correct ? '✓ Correct' : '✗ Wrong'}</span></div>`).join('');
    document.querySelectorAll('#thumbs .thumb').forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    if (focus) document.querySelectorAll('#thumbs .thumb')[i].focus();
  }
  function player() {
    const t = $('#thumbs'); if (!t) return;
    t.innerHTML = cases.map((c, i) => `<button class="thumb" type="button" role="tab" aria-selected="false" data-i="${i}"><img src="${esc(c.poster)}" alt=""><span>${esc(c.label)}</span></button>`).join('');
    t.addEventListener('click', e => { const b = e.target.closest('.thumb'); if (b) showCase(+b.dataset.i); });
    t.addEventListener('keydown', e => {
      const cur = [...t.children].findIndex(x => x.getAttribute('aria-selected') === 'true');
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); showCase((cur + (e.key === 'ArrowRight' ? 1 : cases.length - 1)) % cases.length, true); }
    });
    showCase(0);
    // presentation builds step through the first clips
    $('#examples .slide').addEventListener('deckstep', e => showCase(e.detail.step));
  }

  // ---------- applications: saved CameraVLM checkpoint-1200 outputs, one prompt for every clip (js/apps-data.js) ----------
  const items = window.CV_APPS || [];
  // one sentence from the model's own camera_move label (same JSON answer as the caption)
  const VERB = { pan: 'pans', tilt: 'tilts', dolly: 'dollies', truck: 'trucks', pedestal: 'pedestals', zoom: 'zooms', arc: 'arcs', roll: 'rolls' };
  const DIR = { CCW: 'counterclockwise', CW: 'clockwise' };
  const motionSentence = m => {
    const parts = String(m).split('+').map(x => x.trim().replace(/_/g, ' ')).filter(Boolean);
    if (!parts.length || parts.every(x => x === 'static')) return 'The camera stays static.';
    const ph = parts.map(x => { const [k, ...d] = x.split(' '); return `${VERB[k] || k} ${d.map(w => DIR[w] || w).join(' ')}`.trim(); });
    return 'The camera ' + ph.join(', then ') + '.';
  };
  const LABELS = { camera_move: 'Camera movement', shot_size: 'Shot size', camera_angle: 'Camera angle', composition: 'Composition', focal_length: 'Focal length', lighting: 'Lighting', color_tone: 'Color tone' };
  function showApp(i, focus) {
    const it = items[i]; if (!it) return;
    const v = $('#apps-video');
    setClip(v, it.video, it.poster);
    $('#apps-title').textContent = it.title;
    $('#out-quote').innerHTML = `“${esc(it.caption)} <mark>${esc(motionSentence(it.technique.camera_move))}</mark>”`;
    $('#out-attrs').innerHTML = Object.entries(it.technique).map(([k, val]) =>
      `<div class="attr${k === 'camera_move' ? ' hot' : ''}"><dt>${esc(LABELS[k] || k)}</dt><dd>${esc(val)}</dd></div>`).join('');
    document.querySelectorAll('#apps-thumbs .thumb').forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    if (focus) document.querySelectorAll('#apps-thumbs .thumb')[i].focus();
  }
  function apps() {
    const t = $('#apps-thumbs'); if (!t || !items.length) return;
    t.innerHTML = items.map((it, i) => `<button class="thumb" type="button" role="tab" aria-selected="false" data-i="${i}"><img src="${esc(it.poster)}" alt=""><span>${esc(it.title)}</span></button>`).join('');
    t.addEventListener('click', e => { const b = e.target.closest('.thumb'); if (b) showApp(+b.dataset.i); });
    t.addEventListener('keydown', e => {
      const cur = [...t.children].findIndex(x => x.getAttribute('aria-selected') === 'true');
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); showApp((cur + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length, true); }
    });
    showApp(0);
    $('#applications .slide').addEventListener('deckstep', e => { if (e.detail.step) showApp(e.detail.step % items.length); });
  }
  function pair() {
    const P2 = window.CV_PAIR; if (!P2) return;
    document.querySelectorAll('#pair .pair-card').forEach(card => {
      const d = P2[card.dataset.k]; if (!d) return;
      const v = card.querySelector('video'); v.loop = false; setClip(v, d.video, d.poster);
      card.querySelector('.pair-desc').innerHTML = `“${esc(d.caption)} <mark>${esc(d.motion)}</mark>”`;
    });
    // previs and final render always play in step: start together, restart together when both have ended
    const vs = [...document.querySelectorAll('#pair video')];
    let seen = false;
    const ready = v => v.readyState >= 3 ? Promise.resolve() : new Promise(r => v.addEventListener('canplay', r, { once: true }));
    const restart = () => Promise.all(vs.map(ready)).then(() => { if (!seen || reduce) return; vs.forEach(v => { v.currentTime = 0; }); vs.forEach(v => v.play().catch(() => {})); });
    // the longer clip (final render) is the clock; the other follows it and waits on its last frame
    const clock = () => vs.reduce((a, v) => (v.duration || 0) > (a.duration || 0) ? v : a, vs[0]);
    vs.forEach(v => {
      v.addEventListener('ended', () => { if (v === clock()) restart(); });
      v.addEventListener('timeupdate', () => {
        const c = clock(); if (v !== c || !seen) return;
        vs.forEach(x => { if (x !== c && !x.ended && x.duration && c.currentTime < x.duration && Math.abs(x.currentTime - c.currentTime) > 0.2) x.currentTime = c.currentTime; });
      });
    });
    new IntersectionObserver(es => {
      seen = es[0].isIntersecting;
      if (seen) restart(); else vs.forEach(v => v.pause());
    }, { threshold: .3 }).observe(document.getElementById('pair'));
    window.CVPair = { restart };
  }

  // ---------- autoplay clips in view ----------
  function inView() {
    const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && !reduce) v.play().catch(() => {}); else v.pause(); }), { threshold: .3 });
    document.querySelectorAll('#player-video, #apps-video').forEach(v => io.observe(v));
    document.querySelectorAll('#player-video, #apps-video, #pair video').forEach(v => arm.observe(v));
  }

  // ---------- zoom + copy ----------
  function misc() {
    const dlg = $('#zoom-dialog');
    document.addEventListener('click', e => {
      const z = e.target.closest('[data-zoom]');
      if (z && !document.body.classList.contains('present')) {
        const im = new Image(); im.src = z.dataset.zoom; im.alt = z.querySelector('img')?.alt || '';
        $('#zoom-slot').replaceChildren(im); $('#zoom-cap').textContent = z.dataset.caption || ''; dlg.showModal();
      }
      if (e.target.closest('[data-close]')) e.target.closest('dialog').close();
      if (e.target === dlg) e.target.close();
    });
    const copy = (btn, text) => navigator.clipboard.writeText(text).then(() => { btn.textContent = 'Copied'; setTimeout(() => btn.textContent = 'Copy', 1600); });
    const cb = $('#copy-bib');
    cb && cb.addEventListener('click', () => copy(cb, $('#bibtex').textContent));
    const api = $('#api-dialog');
    document.querySelectorAll('[data-api]').forEach(b => b.addEventListener('click', () => api.showModal()));
    api.addEventListener('click', e => {
      const b = e.target.closest('[data-copy]'); if (b) copy(b, $('#' + b.dataset.copy).textContent);
      if (e.target === api) api.close();
    });
  }

  function abstractToggle() {
    const card = document.querySelector('.abstract'); if (!card) return;
    card.querySelectorAll('[data-abs]').forEach(b => b.addEventListener('click', () => {
      card.classList.toggle('is-short', b.dataset.abs === 'short');
      card.querySelectorAll('[data-abs]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    }));
  }
  function init() { abstractToggle(); mainTable(); player(); apps(); pair(); inView(); misc(); window.CVCharts && CVCharts.init(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
