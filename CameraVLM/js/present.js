(() => {
  const W = 1600, H = 900;
  const body = document.body;
  const slides = [...document.querySelectorAll('.slide')];
  const bar = document.getElementById('deck-bar');
  const el = id => document.getElementById(id);
  let i = 0, step = 0, on = false, auto = null, idle = null, t0 = 0, dwell = 0, raf = 0;

  const stepsOf = s => s.dataset.customSteps ? +s.dataset.customSteps : Math.max(0, ...[...s.querySelectorAll('[data-step]')].map(x => +x.dataset.step));
  // seconds per build step during autoplay; clips get longer
  const dwellOf = s => +(s.dataset.dwell || (s.classList.contains('hero') ? 8 : s.querySelector('video') ? 7 : 5.5));

  function fit() { document.documentElement.style.setProperty('--deck-scale', Math.min(innerWidth / W, innerHeight / H)); }

  function paint() {
    const s = slides[i];
    s.querySelectorAll('[data-step]').forEach(x => x.classList.toggle('shown', +x.dataset.step <= step));
    s.dispatchEvent(new CustomEvent('deckstep', { detail: { step } }));
    el('deck-i').textContent = i + 1;
    el('deck-title').textContent = s.dataset.title || '';
    history.replaceState(null, '', '#slide-' + (i + 1));
  }
  function go(n, atEnd) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    slides[i].classList.remove('on');
    slides[i].querySelectorAll('video').forEach(v => v.pause());
    i = n; step = atEnd ? stepsOf(slides[i]) : 0;
    const s = slides[i];
    s.classList.add('on');
    s.querySelectorAll('video').forEach(v => { if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); } });
    if (s.querySelector('#pair') && window.CVPair) CVPair.restart(); else s.querySelectorAll('video').forEach(v => { v.currentTime = 0; v.play().catch(() => {}); });
    requestAnimationFrame(() => { window.CVCharts && CVCharts.resizeIn(s); paint(); });
    restartTimer();
  }
  function next() { if (step < stepsOf(slides[i])) { step++; paint(); restartTimer(); } else if (i < slides.length - 1) go(i + 1); else stopAuto(); }
  function prev() { if (step > 0) { step--; paint(); restartTimer(); } else if (i > 0) go(i - 1, true); }

  // ---- autoplay with a visible countdown
  function restartTimer() {
    if (!auto) return;
    cancelAnimationFrame(raf);
    const n = stepsOf(slides[i]);
    t0 = performance.now(); dwell = (dwellOf(slides[i]) + n * 2.5) / (n + 1) * 1000;
    const tick = now => { const p = Math.min(1, (now - t0) / dwell); el('deck-fill').style.width = (p * 100) + '%'; if (p >= 1) next(); else raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  function startAuto() { auto = true; el('deck-auto').setAttribute('aria-pressed', 'true'); el('deck-auto').textContent = '❚❚ Pause'; restartTimer(); }
  function stopAuto() { auto = null; cancelAnimationFrame(raf); el('deck-fill').style.width = '0'; el('deck-auto').setAttribute('aria-pressed', 'false'); el('deck-auto').textContent = '▷ Autoplay'; }

  function enter(n = 0, withAuto = false) {
    on = true; body.classList.add('present'); bar.hidden = false; el('deck-n').textContent = slides.length;
    fit(); slides.forEach(s => s.classList.remove('on')); i = n; go(n);
    if (withAuto) startAuto();
    wake();
  }
  function exit() {
    on = false; stopAuto(); body.classList.remove('present'); bar.hidden = true;
    slides.forEach(s => { s.classList.remove('on'); s.querySelectorAll('[data-step]').forEach(x => x.classList.remove('shown')); });
    if (document.fullscreenElement) document.exitFullscreen();
    history.replaceState(null, '', location.pathname);
    const s = slides[i]; s.scrollIntoView({ block: 'start' });
    window.CVCharts && CVCharts.resizeIn();
  }
  function wake() { bar.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => bar.classList.add('idle'), 2200); }

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!on) { if (e.key === 'p' && !e.target.closest('input, textarea, select, [contenteditable]')) enter(0); return; }
    if (e.target.closest('.thumbs, .idx-list')) return;
    const k = e.key;
    // Enter / Space on a focused control activates it instead of advancing the deck
    if ((k === 'Enter' || k === ' ') && e.target.closest('button, a, summary, input, select, textarea')) { wake(); return; }
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0); else if (k === 'End') go(slides.length - 1, true);
    else if (k === 'Escape' && !document.fullscreenElement) exit();
    else if (k === 'a' || k === 'A') auto ? stopAuto() : startAuto();
    else if (k === 'f' || k === 'F') toggleFull();
    wake();
  });
  function toggleFull() { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); }
  document.querySelectorAll('[data-present]').forEach(b => b.addEventListener('click', () => enter(0)));
  el('deck-next').addEventListener('click', next);
  el('deck-prev').addEventListener('click', prev);
  el('deck-exit').addEventListener('click', exit);
  el('deck-full').addEventListener('click', toggleFull);
  el('deck-auto').addEventListener('click', () => auto ? stopAuto() : startAuto());
  addEventListener('resize', () => on && fit());
  addEventListener('mousemove', () => on && wake());
  document.addEventListener('click', e => { if (on && e.target.closest('.slide.on') && !e.target.closest('button, a, video, .chart, table')) next(); });

  // deep links: #present, #present-auto, #slide-N
  const m = location.hash.match(/^#(present(-auto)?|slide-(\d+))$/);
  if (m) enter(m[3] ? +m[3] - 1 : 0, !!m[2]);
  window.CVDeck = { enter, exit, go, next, slides };
})();
