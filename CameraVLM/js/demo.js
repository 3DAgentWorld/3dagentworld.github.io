// Hero demo: one clip in, three synchronized outputs (language, camera pose, point flow).
// Language is CameraVLM's saved output. Point tracks come from the clip; the camera path is schematic (see qa/make_demo.py).
(() => {
  // point tracks and camera path (768 KB) arrive after the first frame: until then the tiles show the poster and the text
  let D = window.CV_DEMO_DATA;
  const STUB = { truck: { crop: [0, 0.1278, 1, 0.8708] }, pan: { crop: [0, 0, 1, 1] } };  // crops as in demo-data.js
  Object.values(STUB).forEach(d => Object.assign(d, { w: 1280, h: 720, t: [0], cam: [[0, 0, 0]], yaw: [0], flow: null }));
  const $ = id => document.getElementById(id);
  const vid = $('demo-video'), inC = $('demo-in'), flowC = $('demo-flow'), poseC = $('demo-pose'), out = $('demo-out'), live = $('demo-live'), wash = $('hero-wash');
  if (!vid || !inC || !flowC || !poseC) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const H = window.CV_HERO, shot = window.CV_HERO_SHOT;
  if (!H || !shot) return;
  // truck: saved checkpoint-1200 benchmark answer. pan: saved checkpoint-1200 caption + seven attributes (js/apps-data.js).
  // on/off contrast what moves in the picture (CoWTracker: truck clip slides left ~650-760 px/s, pan clip right ~105 px/s)
  // with how the camera moved.
  // each clip plays twice: first with its QA answer, then with its description and shot attributes (js/hero-data.js)
  const base = {
    // hero copies: 960x540, no audio, moov at the front, so playback starts after the first few hundred KB
    truck: { src: 'assets/hero-truck.mp4', poster: 'assets/hero-truck-0.webp',
      on: 'Picture slides left', off: 'Camera moves right',
      liveOn: 'Scene slides left, near objects faster', onTag: 'parallax', liveOff: 'Camera moves right', offTag: 'truck' },
    pan: { src: 'assets/hero-pan.mp4', poster: 'assets/hero-pan-0.webp',
      on: 'Picture slides right', off: 'Camera turns left',
      liveOn: 'Scene slides right, near and far together', onTag: 'no parallax', liveOff: 'Camera turns left in place', offTag: 'pan' }
  };
  const clips = [];
  ['truck', 'pan'].forEach(key => ['qa', 'struct'].forEach(kind => clips.push({ key, kind, ...base[key], out: H[key] })));
  // one sentence from the model's own camera_move label (same JSON answer as the caption)
  const VERB = { pan: 'pans', tilt: 'tilts', dolly: 'dollies', truck: 'trucks', pedestal: 'pedestals', zoom: 'zooms', arc: 'arcs', roll: 'rolls' };
  const DIR = { CCW: 'counterclockwise', CW: 'clockwise' };
  const motionSentence = m => {
    const parts = String(m).split('+').map(x => x.trim().replace(/_/g, ' ')).filter(Boolean);
    if (!parts.length || parts.every(x => x === 'static')) return 'The camera stays static.';
    const ph = parts.map(x => { const [k, ...d] = x.split(' '); return `${VERB[k] || k} ${d.map(w => DIR[w] || w).join(' ')}`.trim(); });
    return 'The camera ' + ph.join(', then ') + '.';
  };

  const posters = {};
  Object.values(base).forEach(b => { const im = new Image(); im.src = b.poster; posters[b.poster] = im; });
  const still = () => { const im = posters[clips[ci].poster]; return vid.readyState < 2 && im && im.complete && im.naturalWidth ? im : null; };
  const wctx = wash ? wash.getContext('2d') : null;
  let ci = 0, data = (D || STUB)[clips[0].key], frame = 0, sig = '', dpr = 1;
  const fctx = flowC.getContext('2d'), pctx = poseC.getContext('2d'), ictx = inC.getContext('2d');

  function prep() {
    data = (D || STUB)[clips[ci].key];
    frame = 0; sig = '';
  }
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    [inC, flowC, poseC].forEach(c => { const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr); if (w && (c.width !== w || c.height !== h)) { c.width = w; c.height = h; } });
  }

  // draw the picture area of the video (letterbox removed) to fill a canvas, return the mapping for normalised coords
  function paint(ctx, W, H) {
    const [cx0, cy0, cx1, cy1] = data.crop || [0, 0, 1, 1];
    const im = still(), src = im || vid;
    const vw = (im ? im.naturalWidth : vid.videoWidth) || data.w, vh = (im ? im.naturalHeight : vid.videoHeight) || data.h;
    const sx = cx0 * vw, sy = cy0 * vh, sw = (cx1 - cx0) * vw, sh = (cy1 - cy0) * vh;
    const s = Math.max(W / sw, H / sh), dw = sw * s, dh = sh * s, ox = (W - dw) / 2, oy = (H - dh) / 2;
    if (im || vid.readyState >= 2) ctx.drawImage(src, sx, sy, sw, sh, ox, oy, dw, dh);
    return (x, y) => [ox + ((x - cx0) / (cx1 - cx0)) * dw, oy + ((y - cy0) / (cy1 - cy0)) * dh];
  }
  function drawIn() {
    const W = inC.width, H = inC.height; if (!W) return;
    ictx.clearRect(0, 0, W, H); paint(ictx, W, H);
  }
  function drawFlow(time) {
    const W = flowC.width, H = flowC.height; if (!W) return;
    fctx.clearRect(0, 0, W, H);
    const map = paint(fctx, W, H);
    fctx.fillStyle = 'rgba(4,7,12,.42)'; fctx.fillRect(0, 0, W, H);
    if (data.flow) {
    // CoWTracker 16x16 grid in half-overlapping windows (qa/run_cowtracker_demo.py). Positions are interpolated at the
    // video's current time, and each window fades in as it starts and out as the next one takes over, so the grid
    // never snaps to new points.
    const F = data.flow, L = F.len, N = F.grid * F.grid, T = F.t, S = F.stride || L / 2, TRAIL = Math.round(L * 0.45);
    let f = 0; while (f + 1 < T.length && T[f + 1] <= time) f++;
    f = f + 1 < T.length ? f + Math.min(1, Math.max(0, (time - T[f]) / (T[f + 1] - T[f]))) : f;
    // drop a window that starts within half a stride of the next one (the tracker adds a tail window at T-L)
    const ws = F.windows.filter((w, i, a) => i === a.length - 1 || a[i + 1].s - w.s >= S / 2), col = F.colors || [];
    fctx.lineCap = 'round'; fctx.lineJoin = 'round';
    ws.forEach((w, wi) => {
      const j = f - w.s; if (j < 0 || j > L - 1) return;
      // fade over the exact overlap with the neighbouring window, so the two weights always sum to 1
      const ovIn = wi ? ws[wi - 1].s + L - 1 - w.s : 0, ovOut = wi < ws.length - 1 ? w.s + L - 1 - ws[wi + 1].s : 0;
      const fadeIn = ovIn > 0 ? Math.min(1, j / ovIn) : 1, fadeOut = ovOut > 0 ? Math.min(1, (L - 1 - j) / ovOut) : 1;
      const a = Math.min(fadeIn, fadeOut); if (a <= 0.02) return;
      const at = (o, x) => { const i0 = Math.floor(x), i1 = Math.min(L - 1, i0 + 1), u = x - i0;
        const xa = w.p[o + i0 * 2], ya = w.p[o + i0 * 2 + 1]; if (xa < 0) return null;
        const xb = w.p[o + i1 * 2], yb = w.p[o + i1 * 2 + 1]; if (xb < 0) return u < 0.5 ? map(xa / 1000, ya / 1000) : null;
        return map((xa + (xb - xa) * u) / 1000, (ya + (yb - ya) * u) / 1000); };
      for (let i = 0; i < N; i++) {
        const o = i * L * 2, head = at(o, j); if (!head) continue;
        const pts = [head];
        for (let b = Math.ceil(j) - 1; b >= Math.max(0, j - TRAIL); b--) { const q = at(o, b); if (!q) break; pts.push(q); }
        const rgb = col[i] ? [1, 3, 5].map(k => parseInt(col[i].slice(k, k + 2), 16)).join(',') : '143,184,255';
        for (let k = 0; k < pts.length - 1; k++) {
          fctx.strokeStyle = `rgba(${rgb},${a * 0.95 * (1 - k / pts.length)})`;
          fctx.lineWidth = Math.max(0.6, 2.8 - k * 2.2 / TRAIL) * dpr;
          fctx.beginPath(); fctx.moveTo(pts[k][0], pts[k][1]); fctx.lineTo(pts[k + 1][0], pts[k + 1][1]); fctx.stroke();
        }
        fctx.fillStyle = `rgba(${rgb},${a})`; fctx.beginPath(); fctx.arc(head[0], head[1], 2.8 * dpr, 0, 7); fctx.fill();
      }
    });
    }
    const g = fctx.createLinearGradient(0, H - 52 * dpr, 0, H); g.addColorStop(0, 'rgba(4,7,12,0)'); g.addColorStop(1, 'rgba(4,7,12,.72)');
    fctx.fillStyle = g; fctx.fillRect(0, H - 52 * dpr, W, 52 * dpr);
    fctx.textBaseline = 'bottom'; fctx.textAlign = 'left';
    fctx.fillStyle = '#bcd0ff'; fctx.font = `700 ${14 * dpr}px Archivo, sans-serif`; fctx.fillText(clips[ci].on, 12 * dpr, H - 11 * dpr);
  }

  function drawPose(k) {
    const W = poseC.width, H = poseC.height; if (!W) return;
    const ctx = pctx; ctx.clearRect(0, 0, W, H);
    const cam = data.cam, yaw = data.yaw;
    const xs = cam.map(c => c[0]), zs = cam.map(c => c[2]);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 0.8);
    const sc = (W * 0.62) / span, cx0 = (Math.max(...xs) + Math.min(...xs)) / 2, cz0 = (Math.max(...zs) + Math.min(...zs)) / 2;
    const P = c => [W / 2 + (c[0] - cx0) * sc, H * 0.62 + (c[2] - cz0) * sc];
    // ground grid
    ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = dpr;
    const g = 26 * dpr;
    for (let x = (W / 2) % g; x < W; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // full path (faint, dashed) and travelled path
    ctx.setLineDash([5 * dpr, 5 * dpr]); ctx.strokeStyle = 'rgba(255,138,126,.35)'; ctx.lineWidth = 2 * dpr;
    ctx.beginPath(); cam.forEach((c, i) => { const [x, y] = P(c); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#ff6a5c'; ctx.lineWidth = 3 * dpr;
    ctx.beginPath(); for (let i = 0; i <= k; i++) { const [x, y] = P(cam[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    const [sx, sy] = P(cam[0]); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(sx, sy, 3.5 * dpr, 0, 7); ctx.fill();
    // camera frustum at the current pose
    const [x, y] = P(cam[k]), a = yaw[k], L = 34 * dpr, half = 0.42;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(255,106,92,.28)'; ctx.strokeStyle = '#ff6a5c'; ctx.lineWidth = 2 * dpr;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-Math.sin(half) * L, -Math.cos(half) * L); ctx.lineTo(Math.sin(half) * L, -Math.cos(half) * L); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 4 * dpr, 0, 7); ctx.fill(); ctx.restore();
    // heading sweep (rotation about the camera)
    if (Math.abs(yaw[k] - yaw[0]) > 0.05) {
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath(); ctx.arc(x, y, 46 * dpr, -Math.PI / 2 + yaw[0], -Math.PI / 2 + yaw[k], yaw[k] < yaw[0]); ctx.stroke();
    }
    ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
    ctx.fillStyle = '#ffb3aa'; ctx.font = `700 ${14 * dpr}px Archivo, sans-serif`;
    ctx.fillText(clips[ci].off, 12 * dpr, H - 11 * dpr);
  }

  function drawLive() {
    const c = clips[ci];
    const html = `<span class="dl on"><small>On screen</small>${esc(c.liveOn)}<em>${esc(c.onTag)}</em></span><span class="eq" aria-hidden="true">→</span><span class="dl off"><small>Off screen</small>${esc(c.liveOff)}<em>${esc(c.offTag)}</em></span>`;
    if (live && live.dataset.s !== html) { live.dataset.s = html; live.innerHTML = html; }  // strip removed from the page; no-op
  }

  // very soft colour wash behind the hero, taken from the current clip
  function drawWash() {
    if (!wctx) return;
    const W = 48, H = 28;
    if (wash.width !== W) { wash.width = W; wash.height = H; }
    if (vid.readyState >= 2) { const [cx0, cy0, cx1, cy1] = data.crop || [0, 0, 1, 1], vw = vid.videoWidth, vh = vid.videoHeight; wctx.drawImage(vid, cx0 * vw, cy0 * vh, (cx1 - cx0) * vw, (cy1 - cy0) * vh, 0, 0, W, H); }
  }

  function drawText(p) {
    const c = clips[ci];
    let html;
    const rows = Object.entries(c.out.technique);
    if (c.kind === 'qa') {
      const qa = c.out.qa, pick = qa.choice, chosen = p > 0.1;
      html = `<span class="q">${esc(qa.question)}</span>` + Object.entries(qa.options).map(([k, v]) =>
        `<div class="opt${chosen && k === pick ? ' pick' : ''}"><i>${k}</i><span>${esc(v)}</span>${chosen && k === pick ? '<span class="tick">✓</span>' : ''}</div>`).join('');
    } else {
      const capW = c.out.caption.split(' '), motW = c.out.motion.split(' ');
      const w = Math.max(3, Math.ceil(Math.min(1, p * 3.2) * (capW.length + motW.length)));
      const n = Math.max(0, Math.ceil(Math.min(1, (p - 0.18) * 2.2) * rows.length));
      const motion = motW.slice(0, Math.max(0, w - capW.length)).join(' ');
      html = `<div class="cap"><span class="sub">Description</span><span class="gen">“${esc(capW.slice(0, w).join(' '))}${motion ? ` <mark>${esc(motion)}</mark>` : ''}${w < capW.length + motW.length ? '' : '”'}</span></div>`
        + '<span class="sub">Shot attributes</span>' + rows.slice(0, n).map(([k, v], i) => `<div class="row${i === 0 ? ' hot' : ''}"><i>${k}</i><b>${esc(v)}</b></div>`).join('');
    }
    if (html !== sig) { sig = html; out.innerHTML = html; }
  }

  let raf = 0, running = false, tickN = 0;
  function tick() {
    raf = 0; if (!running) return;
    if (inC.clientWidth) {
      size();
      const t = vid.currentTime, T = data.t;
      let k = frame; if (t < T[k]) k = 0;
      while (k + 1 < T.length && T[k + 1] <= t) k++;
      frame = k;
      drawIn(); drawFlow(t); drawPose(k); drawLive(); if ((tickN = (tickN + 1) % 6) === 0) drawWash();
      drawText(Math.min(1, t / Math.max(0.1, (vid.duration || T[T.length - 1]))));
    }
    raf = requestAnimationFrame(tick);
  }
  const prefetched = {};
  function load(i) {
    const prev = clips[ci];
    ci = i % clips.length; prep();
    if (prev && prev.src === clips[ci].src && vid.getAttribute('src')) { vid.currentTime = 0; }
    else { vid.poster = clips[ci].poster; vid.src = clips[ci].src; vid.load(); }
    // fetch the other clip while this one plays, so the switch has no gap
    const nx = clips.find(c => c.src !== clips[ci].src); if (nx && !prefetched[nx.src]) { prefetched[nx.src] = 1; fetch(nx.src).catch(() => {}); }
    if (!reduce) vid.play().catch(() => {});
  }
  vid.addEventListener('ended', () => load(ci + 1));
  function renderOnce(t) {
    size(); const T = data.t; let k = 0; while (k + 1 < T.length && T[k + 1] <= t) k++;
    frame = k; drawIn(); drawFlow(t); drawPose(k); drawLive(); drawWash(); drawText(1);
  }
  vid.addEventListener('loadeddata', () => { if (reduce || !running) vid.currentTime = Math.min(1.4, (vid.duration || 2) * .45); });
  vid.addEventListener('seeked', () => { if (reduce || !running) renderOnce(vid.currentTime); });

  function start() { if (running) return; running = true; if (!reduce && vid.paused) vid.play().catch(() => {}); if (!raf) raf = requestAnimationFrame(tick); }
  function stop() { running = false; vid.pause(); cancelAnimationFrame(raf); raf = 0; }
  new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? start() : stop())), { threshold: .15 }).observe(document.querySelector('.demo'));
  addEventListener('resize', () => { if (!running) { size(); } });
  if (!D) {
    const sc = document.createElement('script'); sc.src = 'js/demo-data.js';
    sc.onload = () => { D = window.CV_DEMO_DATA; if (D) { const f = frame; prep(); frame = f; } };
    document.head.appendChild(sc);
  }
  load(0);
  requestAnimationFrame(() => { if (!running) { size(); drawIn(); drawFlow(0); drawPose(0); drawText(0); } });
  window.CVDemo = { load, start, stop };
})();
