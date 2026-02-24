(() => {
  const root = document.documentElement;
  const getTheme = () => (root.dataset.theme === "light" ? "light" : "dark");
  const getPalette = (theme) =>
    theme === "light"
      ? {
          linkRgb: [0, 174, 205],
          linkAlpha: 0.08,
          particleLightness: 44,
          particleAlpha: 0.24,
          particleSaturation: 85,
        }
      : {
          linkRgb: [0, 229, 255],
          linkAlpha: 0.12,
          particleLightness: 70,
          particleAlpha: 0.55,
          particleSaturation: 95,
        };

  root.dataset.theme = "light";
  window.localStorage?.setItem("longstream-theme", "light");

  const themeToggle = document.getElementById("theme-toggle");
  const updateThemeToggle = () => {
    if (!themeToggle) return;
    const current = getTheme();
    themeToggle.textContent = current === "light" ? "Dark" : "Light";
  };
  updateThemeToggle();

  themeToggle?.addEventListener("click", () => {
    const current = getTheme();
    const next = current === "light" ? "dark" : "light";
    root.dataset.theme = next;
    window.localStorage?.setItem("longstream-theme", next);
    updateThemeToggle();
    palette = getPalette(next);
  });

  const lightbox = document.getElementById("figure-lightbox");
  const lightboxImage = document.getElementById("figure-lightbox-image");
  const lightboxClose = document.getElementById("figure-lightbox-close");
  const methodFigureLink = document.querySelector(".method-figure-link");

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  if (lightbox && lightboxImage && methodFigureLink) {
    methodFigureLink.addEventListener("click", (event) => {
      event.preventDefault();
      const src = methodFigureLink.getAttribute("href");
      if (!src) return;
      lightboxImage.src = src;
      lightbox.hidden = false;
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });

    lightboxClose?.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }

  const body = document.body;
  const setScrolled = () => {
    body.classList.toggle("is-scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", setScrolled, { passive: true });
  setScrolled();

  let palette = getPalette(getTheme());

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const canvas = document.getElementById("bg-canvas");
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const state = {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    width: 0,
    height: 0,
    particles: [],
    raf: 0,
  };

  const rand = (a, b) => a + Math.random() * (b - a);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    state.width = Math.max(1, Math.floor(rect.width));
    state.height = Math.max(1, Math.floor(rect.height));
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    const targetCount = Math.round((state.width * state.height) / 24000);
    const count = Math.max(28, Math.min(88, targetCount));
    state.particles = Array.from({ length: count }, () => ({
      x: rand(0, state.width),
      y: rand(0, state.height),
      vx: rand(-0.25, 0.25),
      vy: rand(-0.18, 0.18),
      r: rand(1.2, 2.4),
      hue: rand(180, 310),
    }));
  };

  const step = () => {
    ctx.clearRect(0, 0, state.width, state.height);

    const { particles } = state;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = state.width + 20;
      if (p.x > state.width + 20) p.x = -20;
      if (p.y < -20) p.y = state.height + 20;
      if (p.y > state.height + 20) p.y = -20;
    }

    const linkDist = Math.min(160, Math.max(110, state.width * 0.14));

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        const max2 = linkDist * linkDist;
        if (d2 > max2) continue;
        const t = 1 - d2 / max2;
        const alpha = palette.linkAlpha * t;
        ctx.strokeStyle = `rgba(${palette.linkRgb[0]},${palette.linkRgb[1]},${palette.linkRgb[2]},${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (const p of particles) {
      ctx.fillStyle = `hsla(${p.hue}, ${palette.particleSaturation}%, ${palette.particleLightness}%, ${palette.particleAlpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    state.raf = window.requestAnimationFrame(step);
  };

  const start = () => {
    resize();
    window.addEventListener("resize", resize, { passive: true });
    if (state.raf) window.cancelAnimationFrame(state.raf);
    step();
  };

  start();
})();
