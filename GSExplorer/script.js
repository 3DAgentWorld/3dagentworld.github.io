"use strict";

document.querySelectorAll("[data-resource]").forEach(link => {
  const url = window.PROJECT_LINKS?.[link.dataset.resource];
  if (!url) return;
  link.href = url;
  if (url.startsWith("#")) {
    link.removeAttribute("target");
    link.removeAttribute("rel");
  } else {
    link.target = "_blank";
    link.rel = "noopener";
  }
  link.removeAttribute("aria-disabled");
  link.querySelector("small")?.remove();
});

const sections = [...document.querySelectorAll("main section[id]")];
const navigation = [...document.querySelectorAll("nav a")];
const progress = document.querySelector(".reading-progress");
let scrollPending = false;
function updatePosition() {
  const threshold = document.querySelector(".site-header").offsetHeight + 70;
  const current = sections.filter(section => section.getBoundingClientRect().top <= threshold).at(-1);
  navigation.forEach(link => {
    if (link.hash === `#${current?.id}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  const range = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${range > 0 ? Math.min(100, Math.max(0, scrollY / range * 100)) : 0}%`;
  scrollPending = false;
}
addEventListener("scroll", () => {
  if (!scrollPending) { scrollPending = true; requestAnimationFrame(updatePosition); }
}, { passive: true });
addEventListener("resize", updatePosition);
addEventListener("load", updatePosition);
document.querySelectorAll("details").forEach(detail => detail.addEventListener("toggle", updatePosition));
updatePosition();

const mainVideo = document.querySelector("#demo video");
document.querySelectorAll("[data-seek]").forEach(button => button.addEventListener("click", () => {
  const seek = () => { mainVideo.currentTime = Number(button.dataset.seek); };
  if (mainVideo.readyState >= 1) seek();
  else { mainVideo.addEventListener("loadedmetadata", seek, { once: true }); mainVideo.load(); }
  mainVideo.play().catch(() => { /* Native controls remain available if autoplay is blocked. */ });
  mainVideo.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}));

document.querySelectorAll("video:not(.gallery-video)").forEach(video => video.addEventListener("play", () => {
  document.querySelectorAll("video:not(.gallery-video)").forEach(other => { if (other !== video) other.pause(); });
}));

document.querySelectorAll("[data-result]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-result]").forEach(control => control.setAttribute("aria-pressed", String(control === button)));
  document.querySelectorAll(".result-panel").forEach(panel => { panel.hidden = panel.id !== button.dataset.result; });
  updatePosition();
}));

document.querySelector("#copy-citation").addEventListener("click", async () => {
  const code = document.querySelector("#bibtex");
  const status = document.querySelector("#copy-status");
  try {
    await navigator.clipboard.writeText(code.textContent);
    status.textContent = "Citation copied.";
  } catch {
    const selection = getSelection();
    const range = document.createRange();
    range.selectNodeContents(code);
    selection.removeAllRanges(); selection.addRange(range);
    status.textContent = "Citation selected. Press Ctrl+C (or Command+C) to copy.";
  }
});

// The citation remains blank until the authors supply the final BibTeX.
document.querySelector("#copy-citation").disabled = !document.querySelector("#bibtex").textContent.trim();

document.querySelectorAll("[data-case-browser]").forEach(browser => {
  const player = browser.querySelector("video");
  browser.querySelectorAll("[data-video]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;
      player.pause();
      browser.querySelectorAll("[data-video]").forEach(other => other.setAttribute("aria-pressed", String(other === button)));
      player.poster = button.dataset.poster;
      player.querySelector("source").src = button.dataset.video;
      player.setAttribute("aria-label", `Comparison, case ${button.dataset.case}`);
      const caption = browser.querySelector("[data-current-case]");
      if (caption) caption.textContent = button.dataset.case;
      player.load();
      player.play().catch(() => { /* Native play controls are always available. */ });
    });
  });
});

const figureDialog = document.querySelector("#figure-dialog");
const enlargedFigure = document.querySelector("#enlarged-figure");
const zoomFigure = document.querySelector("#zoom-figure");
const figureArea = figureDialog.querySelector(".dialog-image-area");
let figureScale = 1;
let figureFitWidth = 0;
function setFigureZoom(scale, clientX, clientY) {
  if (!figureFitWidth) return;
  const areaRect = figureArea.getBoundingClientRect();
  const before = enlargedFigure.getBoundingClientRect();
  const x = clientX ?? areaRect.left + figureArea.clientWidth / 2;
  const y = clientY ?? areaRect.top + figureArea.clientHeight / 2;
  const relativeX = (x - before.left) / before.width;
  const relativeY = (y - before.top) / before.height;
  figureScale = Math.min(4, Math.max(0.5, scale));
  enlargedFigure.style.width = `${figureFitWidth * figureScale}px`;
  const after = enlargedFigure.getBoundingClientRect();
  figureArea.scrollLeft += after.left + relativeX * after.width - x;
  figureArea.scrollTop += after.top + relativeY * after.height - y;
  zoomFigure.textContent = Math.abs(figureScale - 1) < 0.01 ? "Zoom in +" : "Reset zoom";
  zoomFigure.setAttribute("aria-pressed", String(Math.abs(figureScale - 1) >= 0.01));
}
function resetFigureZoom() {
  figureScale = 1;
  enlargedFigure.style.width = "100%";
  if (figureDialog.open && enlargedFigure.naturalWidth) {
    const ratio = enlargedFigure.naturalWidth / enlargedFigure.naturalHeight;
    figureFitWidth = Math.min(figureArea.clientWidth - 24, enlargedFigure.naturalWidth, (innerHeight * 0.78 - 90) * ratio);
    enlargedFigure.style.width = `${figureFitWidth}px`;
    figureArea.style.height = `${figureFitWidth / ratio + 24}px`;
  } else {
    figureFitWidth = 0;
    figureArea.style.height = "";
  }
  zoomFigure.textContent = "Zoom in +";
  zoomFigure.setAttribute("aria-pressed", "false");
  figureArea.scrollTop = 0; figureArea.scrollLeft = 0;
}
enlargedFigure.addEventListener("load", resetFigureZoom);
figureArea.addEventListener("wheel", event => {
  if (!figureDialog.open || !figureFitWidth) return;
  event.preventDefault();
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? figureArea.clientHeight : 1);
  setFigureZoom(figureScale * Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.002), event.clientX, event.clientY);
}, { passive: false });
addEventListener("resize", () => { if (figureDialog.open) resetFigureZoom(); });
document.querySelectorAll(".paper-figure > a").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    enlargedFigure.src = link.href;
    enlargedFigure.alt = link.querySelector("img").alt;
    resetFigureZoom();
    figureDialog.showModal();
    resetFigureZoom();
    document.body.classList.add("figure-open");
  });
});
document.querySelector("#close-figure").addEventListener("click", () => figureDialog.close());
zoomFigure.addEventListener("click", () => {
  if (Math.abs(figureScale - 1) < 0.01) setFigureZoom(1.5);
  else resetFigureZoom();
});
figureDialog.addEventListener("click", event => {
  if (event.target === figureDialog) figureDialog.close();
});
figureDialog.addEventListener("close", () => {
  document.body.classList.remove("figure-open");
  resetFigureZoom();
});

const galleryVideos = [...document.querySelectorAll(".gallery-video")];
const galleryToggle = document.querySelector("#gallery-toggle");
let galleryPaused = matchMedia("(prefers-reduced-motion: reduce)").matches || Boolean(navigator.connection?.saveData);
const inView = new Set();
function syncGallery() {
  galleryToggle.textContent = galleryPaused ? "Play gallery" : "Pause gallery";
  galleryToggle.setAttribute("aria-pressed", String(galleryPaused));
  galleryVideos.forEach(video => {
    if (!galleryPaused && !document.hidden && inView.has(video)) {
      if (!video.hasAttribute("src")) video.src = video.dataset.src;
      video.muted = true;
      video.play().catch(() => { /* Browsers may require the native play button. */ });
    } else video.pause();
  });
}
const galleryObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) inView.add(entry.target);
    else inView.delete(entry.target);
  });
  syncGallery();
}, { threshold: 0.15 });
galleryVideos.forEach(video => {
  galleryObserver.observe(video);
  video.addEventListener("pointerenter", () => { video.controls = true; });
  video.addEventListener("pointerleave", () => { if (document.activeElement !== video) video.controls = false; });
  video.addEventListener("focus", () => { video.controls = true; });
  video.addEventListener("blur", () => { video.controls = false; });
  video.addEventListener("pointerdown", () => {
    video.controls = true;
    if (!video.hasAttribute("src")) video.src = video.dataset.src;
  }, { once: true });
});
galleryToggle.addEventListener("click", () => { galleryPaused = !galleryPaused; syncGallery(); });
document.addEventListener("visibilitychange", syncGallery);
syncGallery();
