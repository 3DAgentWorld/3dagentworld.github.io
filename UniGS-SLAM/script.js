(() => {
  const config = window.UNIGS_SITE || {};
  const safeURL = value => {
    if (!value) return null;
    try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; }
    catch { return null; }
  };
  for (const key of ['paper', 'arxiv', 'code']) {
    const node = document.querySelector(`[data-resource="${key}"]`);
    const url = safeURL(config[key]);
    if (!url || !node) continue;
    const link = document.createElement('a');
    link.className = 'resource'; link.href = url;
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = {paper:'Paper ↗',arxiv:'arXiv ↗',code:'Code ↗'}[key];
    node.replaceWith(link);
  }
  if (config.citation) {
    const node = document.querySelector('#citation-text');
    node.textContent = config.citation; node.hidden = false;
    document.querySelector('#citation-pending').hidden = true;
    document.querySelector('#citation').hidden = false;
  }
  // Dataset tab switching. Keep labels and image paths in index.html.
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const activate = (tab, focus = false) => {
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    }
    if (focus) tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); activate(tabs[next], true);
    });
  });
})();

// Switch the compact RGB player between the supplied Replica clips.
(() => {
  const video = document.getElementById('rgb-reconstruction');
  if (!video) return;
  const buttons = document.querySelectorAll('[data-video-src]');
  buttons.forEach(button => button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    video.pause();
    video.querySelector('source').src = button.dataset.videoSrc;
    video.querySelector('a').href = button.dataset.videoSrc;
    video.poster = button.dataset.videoPoster;
    document.getElementById('rgb-video-caption').textContent = button.dataset.videoCaption;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    video.load();
  }));
  // Keep simultaneous players from competing for attention and decoding work.
  document.querySelectorAll('video').forEach(player => player.addEventListener('play', () => {
    document.querySelectorAll('video').forEach(other => { if (other !== player) other.pause(); });
  }));
})();
